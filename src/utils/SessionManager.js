import { notification } from 'antd';
import dayjs from 'dayjs';
import { triggerAutoStop, calculateEstimatedEnergy, checkSessionExpiry } from '../service/auto-stop.api';

/**
 * Enhanced Session Manager with Auto-Stop Integration
 * Handles automatic session monitoring, duration tracking, and auto-stop functionality
 */
class SessionManager {
    constructor() {
        this.activeTimers = new Map();
        this.notificationSent = new Set();
        this.autoStopAttempts = new Map(); // Track auto-stop attempts to prevent duplicates
    }

    /**
     * Start monitoring a session for automatic duration management and auto-stop
     * @param {Object} session - Session object with sessionId, pointId, duration, startTime
     * @param {Function} onUpdate - Callback when session progress updates
     * @param {Function} onAutoStopped - Callback when session is auto-stopped
     * @param {Function} onRefreshNeeded - Callback to refresh charging points display
     */
    monitorSession(session, onUpdate, onAutoStopped, onRefreshNeeded) {
        const { sessionId, pointId, duration, startTime } = session;

        if (!sessionId || !pointId || !duration || !startTime) {
            console.error('SessionManager: Invalid session data for monitoring', session);
            return;
        }

        // Clear existing timer if any
        this.stopMonitoring(pointId);

        console.log(`SessionManager: Starting monitoring for session ${sessionId}, duration: ${duration} minutes`);

        const intervalId = setInterval(async () => {
            try {
                const progress = this.calculateProgress(startTime, duration);

                // Update progress
                if (onUpdate) {
                    onUpdate(pointId, progress);
                }

                // Check if session should be auto-stopped
                const expiryCheck = checkSessionExpiry({
                    sessionId,
                    startTime,
                    duration
                });

                if (expiryCheck.shouldStop) {
                    console.log(`SessionManager: Session ${sessionId} should be auto-stopped:`, expiryCheck.reason);
                    await this.handleAutoStop(session, onAutoStopped, onRefreshNeeded);
                    return; // Stop monitoring after auto-stop
                }

                // Send warning notifications
                this.sendWarningNotifications(session, progress);

            } catch (error) {
                console.error(`SessionManager: Error monitoring session ${sessionId}:`, error);
            }
        }, 30000); // Check every 30 seconds

        this.activeTimers.set(pointId, intervalId);
        console.log(`SessionManager: Started monitoring session ${sessionId} for point ${pointId}`);
    }

    /**
     * Handle automatic stopping of an expired session
     * @param {Object} session - Session object
     * @param {Function} onAutoStopped - Callback when session is auto-stopped
     * @param {Function} onRefreshNeeded - Callback to refresh display
     */
    async handleAutoStop(session, onAutoStopped, onRefreshNeeded) {
        const { sessionId, pointId } = session;

        // Prevent duplicate auto-stop attempts
        const attemptKey = `${sessionId}_${pointId}`;
        if (this.autoStopAttempts.has(attemptKey)) {
            console.log(`SessionManager: Auto-stop already attempted for session ${sessionId}`);
            return;
        }

        this.autoStopAttempts.set(attemptKey, Date.now());

        // Stop monitoring
        this.stopMonitoring(pointId);

        try {
            // Calculate estimated energy consumption
            const estimatedEnergy = calculateEstimatedEnergy({
                startTime: session.startTime,
                maxPower: session.maxPower || 25, // Default power if not available
                duration: session.duration
            });

            // Trigger auto-stop using existing stop API
            await triggerAutoStop(sessionId, {
                energyConsumed: estimatedEnergy,
                paymentMethod: session.paymentMethod || "e-wallet"
            });

            // Show success notification
            notification.success({
                message: 'Session Automatically Stopped',
                description: `Session ${sessionId} at Point ${pointId} has been automatically stopped after ${session.duration} minutes. Energy consumed: ${estimatedEnergy}kWh`,
                duration: 15,
                placement: 'topRight'
            });

            // Call callbacks
            if (onAutoStopped) {
                onAutoStopped(pointId, sessionId);
            }

            // Refresh charging points display
            if (onRefreshNeeded) {
                setTimeout(() => onRefreshNeeded(), 1000); // Delay to allow backend to process
            }

            console.log(`SessionManager: Successfully auto-stopped session ${sessionId}`);

        } catch (error) {
            console.error(`SessionManager: Failed to auto-stop session ${sessionId}:`, error);

            // Show error notification
            notification.error({
                message: 'Auto-Stop Failed',
                description: `Session ${sessionId} has exceeded its ${session.duration} minute duration but could not be stopped automatically. Please stop it manually.`,
                duration: 0, // Don't auto-close
                placement: 'topRight'
            });

            // Remove from attempts so it can be retried
            this.autoStopAttempts.delete(attemptKey);
        }
    }

    /**
     * Stop monitoring a session
     * @param {number} pointId - Charging point ID
     */
    stopMonitoring(pointId) {
        const timerId = this.activeTimers.get(pointId);
        if (timerId) {
            clearInterval(timerId);
            this.activeTimers.delete(pointId);
            this.notificationSent.delete(`${pointId}_15min`);
            this.notificationSent.delete(`${pointId}_5min`);
            console.log(`SessionManager: Stopped monitoring point ${pointId}`);
        }
    }

    /**
     * Calculate session progress and time remaining
     * @param {string} startTime - ISO string of start time
     * @param {number} duration - Duration in minutes
     * @returns {Object} Progress information
     */
    calculateProgress(startTime, duration) {
        const start = dayjs(startTime);
        const end = start.add(duration, 'minutes'); // Changed from hours to minutes
        const now = dayjs();

        const totalMinutes = duration; // Already in minutes, no conversion needed
        const elapsedMinutes = now.diff(start, 'minute');
        const remainingMinutes = end.diff(now, 'minute');

        return {
            progress: Math.min(100, Math.max(0, (elapsedMinutes / totalMinutes) * 100)),
            remainingMinutes: Math.max(0, remainingMinutes),
            elapsedMinutes: elapsedMinutes,
            isExpired: remainingMinutes <= 0,
            endTime: end.format('HH:mm:ss'),
            startTime: start.format('HH:mm:ss'),
            overrunMinutes: remainingMinutes < 0 ? Math.abs(remainingMinutes) : 0
        };
    }

    /**
     * Send warning notifications as session approaches expiry
     * @param {Object} session - Session object
     * @param {Object} progress - Progress information
     */
    sendWarningNotifications(session, progress) {
        const { sessionId, pointId } = session;

        // 15-minute warning
        if (progress.remainingMinutes <= 15 && progress.remainingMinutes > 5) {
            const notificationKey = `${pointId}_15min`;
            if (!this.notificationSent.has(notificationKey)) {
                notification.warning({
                    message: 'Session Ending Soon',
                    description: `Session ${sessionId} at Point ${pointId} will end in ${Math.round(progress.remainingMinutes)} minutes`,
                    duration: 10,
                    placement: 'topRight'
                });
                this.notificationSent.add(notificationKey);
                console.log(`SessionManager: Sent 15-minute warning for session ${sessionId}`);
            }
        }

        // 5-minute critical warning
        if (progress.remainingMinutes <= 5 && progress.remainingMinutes > 0) {
            const notificationKey = `${pointId}_5min`;
            if (!this.notificationSent.has(notificationKey)) {
                notification.error({
                    message: 'Session Ending Very Soon!',
                    description: `Session ${sessionId} at Point ${pointId} will end in ${Math.round(progress.remainingMinutes)} minutes and will be automatically stopped.`,
                    duration: 0, // Don't auto-close
                    placement: 'topRight'
                });
                this.notificationSent.add(notificationKey);
                console.log(`SessionManager: Sent 5-minute critical warning for session ${sessionId}`);
            }
        }

        // Overrun warning (session exceeded planned duration)
        if (progress.overrunMinutes > 0) {
            const overrunKey = `${pointId}_overrun`;
            if (!this.notificationSent.has(overrunKey)) {
                notification.warning({
                    message: 'Session Duration Exceeded',
                    description: `Session ${sessionId} has exceeded its planned duration by ${Math.round(progress.overrunMinutes)} minutes. Auto-stop will trigger soon.`,
                    duration: 0,
                    placement: 'topRight'
                });
                this.notificationSent.add(overrunKey);
            }
        }
    }

    /**
     * Get progress for a specific session
     * @param {number} pointId - Charging point ID
     * @param {Object} session - Session data
     * @returns {Object|null} Progress information or null if not found
     */
    getSessionProgress(pointId, session) {
        if (!session || !session.startTime || !session.duration) {
            return null;
        }

        return this.calculateProgress(session.startTime, session.duration);
    }

    /**
     * Check all monitored sessions for auto-stop conditions
     * @param {Array} sessions - Array of active sessions
     * @param {Function} onRefreshNeeded - Callback to refresh display
     */
    async checkAllSessionsForAutoStop(sessions, onRefreshNeeded) {
        console.log(`SessionManager: Checking ${sessions.length} sessions for auto-stop conditions`);

        for (const session of sessions) {
            const expiryCheck = checkSessionExpiry(session);

            if (expiryCheck.shouldStop) {
                console.log(`SessionManager: Found expired session ${session.sessionId}:`, expiryCheck.reason);
                await this.handleAutoStop(session, null, onRefreshNeeded);
            }
        }
    }

    /**
     * Clean up all timers and attempts (call on component unmount)
     */
    cleanup() {
        this.activeTimers.forEach((timerId) => {
            clearInterval(timerId);
        });
        this.activeTimers.clear();
        this.notificationSent.clear();
        this.autoStopAttempts.clear();
        console.log('SessionManager: Cleaned up all timers and data');
    }
}

// Export singleton instance
export const sessionManager = new SessionManager();
export default SessionManager;
