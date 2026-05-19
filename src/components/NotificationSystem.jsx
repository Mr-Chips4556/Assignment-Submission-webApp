import { useState, useEffect, createContext, useContext } from "react";

const NotificationContext = createContext();

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (message, type = "info", duration = 5000) => {
        const id = Date.now() + Math.random();
        const notification = { id, message, type, duration };

        setNotifications(prev => [...prev, notification]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const success = (message, duration) => addNotification(message, "success", duration);
    const error = (message, duration) => addNotification(message, "error", duration);
    const warning = (message, duration) => addNotification(message, "warning", duration);
    const info = (message, duration) => addNotification(message, "info", duration);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
}

function NotificationContainer() {
    const { notifications, removeNotification } = useNotifications();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
}

function NotificationItem({ notification, onRemove }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 5);
    }, []);

    const handleRemove = () => {
        setIsVisible(false);
        setTimeout(onRemove, 300);
    };

    const getStyles = () => {
        switch (notification.type) {
            case "success":
                return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
            case "error":
                return "bg-red-500/10 border-red-500/20 text-red-400";
            case "warning":
                return "bg-amber-500/10 border-amber-500/20 text-amber-400";
            default:
                return "bg-ink-500/10 border-ink-500/20 text-ink-400";
        }
    };

    const getIcon = () => {
        switch (notification.type) {
            case "success":
                return "✅";
            case "error":
                return "❌";
            case "warning":
                return "⚠️";
            default:
                return "ℹ️";
        }
    };

    return (
        <div
            className={`
        ${getStyles()}
        border rounded-xl p-4 backdrop-blur-sm shadow-lg
        transform transition-all duration-300 ease-out
        ${isVisible
                    ? "translate-x-0 opacity-100 scale-100"
                    : "translate-x-full opacity-0 scale-95"
                }
      `}
        >
            <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">{getIcon()}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.message}</p>
                </div>
                <button
                    onClick={handleRemove}
                    className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}