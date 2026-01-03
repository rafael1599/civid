<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GroqMCPClient
{
    protected string $apiKey;

    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->baseUrl = config('services.groq.base_url', 'https://api.groq.com/openai/v1/chat/completions');
    }

    /**
     * Low-level method to call any Groq MCP connector
     */
    public function callConnector(string $connector, string $accessToken, array $params = []): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout(30)->post($this->baseUrl, [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $params['prompt'] ?? 'Perform the requested action',
                ],
            ],
            'tools' => [
                [
                    'type' => 'mcp',
                    'mcp' => [
                        'connector' => $connector,
                        'authorization' => $accessToken,
                        'server_url' => null, // null for Groq-hosted connectors
                    ],
                ],
            ],
        ]);

        if (! $response->successful()) {
            throw new \Exception('Groq MCP call failed: '.$response->body());
        }

        return $response->json();
    }

    /**
     * Search emails using Gmail connector
     */
    public function searchEmails(string $accessToken, string $query): array
    {
        return $this->callConnector('connector_gmail', $accessToken, [
            'prompt' => "Search emails with query: {$query}",
        ]);
    }

    /**
     * Read specific email content
     */
    public function readEmail(string $accessToken, string $emailId): array
    {
        return $this->callConnector('connector_gmail', $accessToken, [
            'prompt' => "Read email with ID: {$emailId}",
        ]);
    }

    /**
     * Search calendar events
     */
    public function searchCalendarEvents(string $accessToken, string $timeMin, string $timeMax): array
    {
        return $this->callConnector('connector_googlecalendar', $accessToken, [
            'prompt' => "Search events between {$timeMin} and {$timeMax}",
        ]);
    }
}
