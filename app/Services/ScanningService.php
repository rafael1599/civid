<?php

namespace App\Services;

use App\Models\PendingConfirmation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ScanningService
{
    public function __construct(
        protected GroqMCPClient $groqClient,
        protected PayeeMatchingService $payeeMatching,
        protected IngestionService $ingestion
    ) {}

    /**
     * Main orchestration method - scan both Gmail and Calendar
     */
    public function scanUserData(User $user): array
    {
        if (! $user->hasValidGoogleToken()) {
            throw new \Exception('User does not have valid Google token');
        }

        $results = [
            'gmail' => [],
            'calendar' => [],
            'total_created' => 0,
        ];

        try {
            $results['gmail'] = $this->scanEmails($user);
            $results['total_created'] += count($results['gmail']);
        } catch (\Exception $e) {
            Log::error('Gmail scan failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        try {
            $results['calendar'] = $this->scanEvents($user);
            $results['total_created'] += count($results['calendar']);
        } catch (\Exception $e) {
            Log::error('Calendar scan failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $results;
    }

    /**
     * Scan Gmail for receipts and invoices
     */
    public function scanEmails(User $user): array
    {
        $query = $this->buildGmailQuery();

        $response = $this->groqClient->searchEmails($user->google_token, $query);

        return $this->processEmailResults($user, $response);
    }

    /**
     * Scan Google Calendar for upcoming payments
     */
    public function scanEvents(User $user): array
    {
        $now = Carbon::now();
        $future = $now->copy()->addDays(30);

        $response = $this->groqClient->searchCalendarEvents(
            $user->google_token,
            $now->toIso8601String(),
            $future->toIso8601String()
        );

        return $this->processCalendarResults($user, $response);
    }

    /**
     * Build optimized Gmail search query
     * Excludes newsletters, promotions, social updates
     */
    protected function buildGmailQuery(): string
    {
        return implode(' ', [
            'category:primary',
            '-category:promotions',
            '-category:social',
            '-category:forums',
            'subject:(factura OR receipt OR payment OR invoice OR "total" OR "amount due")',
            '(has:attachment OR currency:$ OR currency:MXN)',
            'newer_than:1d', // Last 24 hours only
        ]);
    }

    /**
     * Process email results from Groq
     */
    protected function processEmailResults(User $user, array $response): array
    {
        $created = [];

        // Extract emails from Groq response
        // Format may vary, adapt based on actual Groq response structure
        $emails = $response['emails'] ?? $response['items'] ?? [];

        foreach ($emails as $email) {
            $sourceId = hash('sha256', ($email['id'] ?? '').$user->id);

            // Skip if already processed
            if (PendingConfirmation::where('source_id', $sourceId)->exists()) {
                continue;
            }

            // Extract sender info
            $senderEmail = $email['from'] ?? $email['sender'] ?? '';
            $senderName = $email['from_name'] ?? '';

            // Detect if email has attachments but empty body (needs manual review)
            $hasAttachments = ! empty($email['attachments']) || ($email['has_attachments'] ?? false);
            $bodyEmpty = empty(trim($email['body'] ?? $email['snippet'] ?? ''));
            $requiresManualReview = $hasAttachments && $bodyEmpty;
            $reviewReason = $requiresManualReview ? 'Email body empty, has PDF attachment' : null;

            // Try to match sender with existing entity
            $matchedEntity = null;
            if ($senderEmail) {
                $matchedEntity = $this->payeeMatching->findMatchingEntity($user, $senderEmail, $senderName);
            }

            // Use Gemini to parse the email content
            try {
                $parsed = $this->ingestion->handle($email['body'] ?? $email['snippet'] ?? '', $user);

                // If we found a matching entity, inject it into parsed data
                if ($matchedEntity && ! empty($parsed['actions'])) {
                    foreach ($parsed['actions'] as &$action) {
                        if (empty($action['params']['entity_id'])) {
                            $action['params']['entity_id'] = $matchedEntity->id;
                            $action['params']['entity_name'] = $matchedEntity->name;
                            $action['metadata']['auto_matched'] = true;
                        }
                    }
                }

                $confirmation = PendingConfirmation::create([
                    'user_id' => $user->id,
                    'source_type' => 'gmail',
                    'source_id' => $sourceId,
                    'source_external_id' => $email['id'] ?? '',
                    'raw_data' => $email,
                    'extracted_data' => $parsed,
                    'confidence_score' => $this->calculateConfidence($parsed, $user, $requiresManualReview),
                    'requires_manual_review' => $requiresManualReview,
                    'review_reason' => $reviewReason,
                    'status' => 'pending',
                ]);

                $created[] = $confirmation;
            } catch (\Exception $e) {
                Log::error('Email parsing failed', [
                    'email_id' => $email['id'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $created;
    }

    /**
     * Process calendar results from Groq
     */
    protected function processCalendarResults(User $user, array $response): array
    {
        $created = [];

        $events = $response['events'] ?? $response['items'] ?? [];

        foreach ($events as $event) {
            // Only process events with payment-related keywords
            $title = $event['summary'] ?? '';
            if (! $this->isPaymentRelated($title)) {
                continue;
            }

            $sourceId = hash('sha256', ($event['id'] ?? '').$user->id);

            if (PendingConfirmation::where('source_id', $sourceId)->exists()) {
                continue;
            }

            try {
                $parsed = $this->ingestion->handle($title.' '.($event['description'] ?? ''), $user);

                $confirmation = PendingConfirmation::create([
                    'user_id' => $user->id,
                    'source_type' => 'calendar',
                    'source_id' => $sourceId,
                    'source_external_id' => $event['id'] ?? '',
                    'raw_data' => $event,
                    'extracted_data' => $parsed,
                    'confidence_score' => $this->calculateConfidence($parsed, $user),
                    'status' => 'pending',
                ]);

                $created[] = $confirmation;
            } catch (\Exception $e) {
                Log::error('Calendar event parsing failed', [
                    'event_id' => $event['id'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $created;
    }

    /**
     * Check if calendar event title is payment-related
     */
    protected function isPaymentRelated(string $title): bool
    {
        $keywords = ['pago', 'factura', 'mensualidad', 'cuota', 'vence', 'renta', 'payment'];

        foreach ($keywords as $keyword) {
            if (stripos($title, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate confidence score based on parsed data quality
     */
    protected function calculateConfidence(array $parsed, User $user, bool $requiresManualReview = false): int
    {
        $score = $this->ingestion->calculateConfidence($parsed['actions'] ?? [], $user);

        // Has clarification (lower confidence)
        if (! empty($parsed['clarification'])) {
            $score -= 20;
        }

        // Requires manual review (significantly lower confidence)
        if ($requiresManualReview) {
            $score -= 30;
        }

        return min(100, max(0, $score));
    }
}
