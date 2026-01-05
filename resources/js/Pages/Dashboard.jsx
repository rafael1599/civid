import ZenLayout from '@/Layouts/ZenLayout';
import { Head, usePage } from '@inertiajs/react';
import TransactionEditModal from '@/Components/TransactionEditModal';
import TransactionCreateModal from '@/Components/TransactionCreateModal';
import QuickFixModal from '@/Components/QuickFixModal';
import WalletManagementModal from '@/Components/WalletManagementModal';
import { useState } from 'react';
import { router } from '@inertiajs/react';

// New component imports
import NetWorthHeader from '@/Components/Dashboard/NetWorthHeader';
import TopActivityChart from '@/Components/Dashboard/TopActivityChart';
import RecentActivity from '@/Components/Dashboard/RecentActivity';
import FinanceActionMenu from '@/Components/Dashboard/FinanceActionMenu';
import TransactionFlowModal from '@/Components/Dashboard/TransactionFlowModal';
import useDeleteResource from '@/Hooks/useDeleteResource';

export default function Dashboard({ total_balance, history, wallets, entities, active_entities, this_month, top_activity, ecosystem, forecast }) {
    const { url } = usePage();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [topActivityType, setTopActivityType] = useState('EXPENSES');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isQuickFixOpen, setIsQuickFixOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
    const [flowType, setFlowType] = useState('EXPENSE');

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
    };

    const handleQuickFix = (e, event) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setIsQuickFixOpen(true);
    };

    const isEventIncomplete = (event) => {
        if (!event.amount || event.amount === 0) return true;
        if (!event.occurred_at) return true;

        // If it's a future commitment (SCHEDULED), we don't require a wallet yet
        if (event.status === 'SCHEDULED') return false;

        // In the context of Dashboard history/ticker, entity_id should be a FINANCE entity (wallet)
        if (!event.entity_id) return true;

        const title = event.title?.toLowerCase() || '';
        const entityName = event.entity?.name?.toLowerCase() || event.entity_name?.toLowerCase() || '';
        const entityCategory = event.entity?.category || event.entity_category || null;

        // If the transaction is assigned to something that isn't a wallet, it's incomplete
        if (entityCategory !== 'FINANCE') return true;

        if (title.includes('desconocido') || title.includes('transacción omnibox')) return true;
        if (entityName.includes('billetera principal') && title.includes('transacción omnibox')) return true;

        return false;
    };

    const handleMarkAsPaid = (e, event) => {
        e.stopPropagation();
        if (confirm(`¿Confirmas que pagaste $${Math.abs(event.amount).toLocaleString()} hoy?`)) {
            router.post(route('events.mark-as-paid', event.id), {}, {
                preserveScroll: true
            });
        }
    };

    const { deleteResource } = useDeleteResource();

    const handleDeleteEvent = (event) => {
        deleteResource(route('life-events.destroy', event.id), {
            title: `"${event.title}"`
        });
    };

    // Swipe-to-delete logic
    const [touchStart, setTouchStart] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [swipingId, setSwipingId] = useState(null);

    const minSwipeDistance = 100;

    const onTouchStart = (e, id) => {
        setTouchStart(e.targetTouches[0].clientX);
        setSwipingId(id);
        setSwipeOffset(0);
    };

    const onTouchMove = (e) => {
        if (!touchStart) return;
        const currentTouch = e.targetTouches[0].clientX;
        const diff = currentTouch - touchStart;

        // Only allow swiping to the right
        if (diff > 0) {
            setSwipeOffset(diff);

            // Prevent dashboard/page horizontal movement when swiping an item
            if (diff > 10 && e.cancelable) {
                e.preventDefault();
            }
        }
    };

    const onTouchEnd = (event) => {
        if (swipeOffset > minSwipeDistance) {
            handleDeleteEvent(event);
        }

        setSwipingId(null);
        setTouchStart(null);
        setSwipeOffset(0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';

        // Ensure we only use the YYYY-MM-DD part to avoid parsing errors with appended time
        const baseDate = dateString.split('T')[0];
        const date = new Date(baseDate + 'T12:00:00');

        if (isNaN(date.getTime())) return dateString;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const diffInDays = Math.floor(Math.abs(date - now) / (1000 * 60 * 60 * 24));

        if (diffInDays <= 14) {
            // "lunes 5" -> "Lunes 5"
            const formatted = new Intl.DateTimeFormat('es-ES', {
                weekday: 'long',
                day: 'numeric'
            }).format(date);
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        } else {
            // "mm/dd"
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }
    };

    return (
        <ZenLayout>
            <Head title="Home" />

            <TransactionEditModal
                show={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                event={selectedEvent}
                entities={wallets || []}
                onDelete={handleDeleteEvent}
            />

            {/* Commitment modal removed as per user request */}

            <QuickFixModal
                show={isQuickFixOpen}
                onClose={() => setIsQuickFixOpen(false)}
                event={selectedEvent}
                entities={wallets || []}
            />

            <WalletManagementModal
                show={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                wallets={wallets || []}
            />

            {/* Mundo A: The Pulse */}
            <div className="space-y-12 pb-24">
                <NetWorthHeader
                    total_balance={total_balance}
                    this_month={this_month}
                    forecast={forecast}
                    onWalletClick={() => setIsWalletModalOpen(true)}
                    upcomingBills={forecast.upcoming_bills}
                    handleEditEvent={handleEditEvent}
                    handleQuickFix={handleQuickFix}
                    handleMarkAsPaid={handleMarkAsPaid}
                    isEventIncomplete={isEventIncomplete}
                    formatDate={formatDate}
                />

                <TopActivityChart top_activity={top_activity} topActivityType={topActivityType} setTopActivityType={setTopActivityType} formatCurrency={formatCurrency} />

                <RecentActivity history={history} handleEditEvent={handleEditEvent} handleQuickFix={handleQuickFix} handleMarkAsPaid={handleMarkAsPaid} isEventIncomplete={isEventIncomplete} formatCurrency={formatCurrency} formatDate={formatDate} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} swipingId={swipingId} swipeOffset={swipeOffset} touchStart={touchStart} />
            </div>

            <FinanceActionMenu
                onAction={(type) => {
                    setFlowType(type);
                    setIsFlowModalOpen(true);
                }}
            />

            <TransactionFlowModal
                show={isFlowModalOpen}
                onClose={() => setIsFlowModalOpen(false)}
                type={flowType}
                wallets={wallets || []}
                entities={entities || []}
            />
        </ZenLayout>
    );
}
