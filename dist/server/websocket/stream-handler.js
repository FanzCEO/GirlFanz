"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamWebSocketHandler = exports.StreamWebSocketHandler = void 0;
exports.initStreamWebSocketHandler = initStreamWebSocketHandler;
const ws_1 = require("ws");
const streaming_1 = require("../services/streaming");
const storage_1 = require("../storage");
const verification_1 = require("../services/verification");
class StreamWebSocketHandler {
    constructor(wss) {
        this.connections = new Map();
        this.wss = wss;
        streaming_1.streamingService.setWebSocketServer(wss);
        // Setup heartbeat to detect disconnected clients
        this.setupHeartbeat();
    }
    // Handle new WebSocket connection
    async handleConnection(ws, request) {
        console.log('New WebSocket connection for streaming');
        // Setup connection handlers
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                await this.handleMessage(ws, data);
            }
            catch (error) {
                console.error('WebSocket message error:', error);
                this.sendError(ws, 'Invalid message format');
            }
        });
        ws.on('close', () => {
            this.handleDisconnection(ws);
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.handleDisconnection(ws);
        });
        // Send initial connection success
        this.sendMessage(ws, {
            type: 'connection_established',
            data: { message: 'Connected to streaming service' }
        });
    }
    // Handle incoming messages
    async handleMessage(ws, message) {
        const { type, sessionId, userId, data } = message;
        // Handle authentication first
        if (type === 'authenticate') {
            return this.handleAuthentication(ws, data);
        }
        // Check if authenticated for other operations
        if (!ws.userId) {
            return this.sendError(ws, 'Authentication required');
        }
        try {
            switch (type) {
                case 'create_stream':
                    await this.handleCreateStream(ws, data);
                    break;
                case 'join_stream':
                    await this.handleJoinStream(ws, sessionId, ws.userId, data);
                    break;
                case 'leave_stream':
                    await this.handleLeaveStream(ws, sessionId, ws.userId);
                    break;
                case 'start_stream':
                    await this.handleStartStream(ws, sessionId);
                    break;
                case 'end_stream':
                    await this.handleEndStream(ws, sessionId);
                    break;
                case 'invite_costar':
                    await this.handleInviteCoStar(ws, sessionId, data);
                    break;
                case 'remove_costar':
                    await this.handleRemoveCoStar(ws, sessionId, data.userId);
                    break;
                case 'send_chat':
                    await this.handleChatMessage(ws, sessionId, data);
                    break;
                case 'send_gift':
                    await this.handleGift(ws, sessionId, data);
                    break;
                case 'send_reaction':
                    await this.handleReaction(ws, sessionId, data);
                    break;
                case 'webrtc_offer':
                case 'webrtc_answer':
                case 'webrtc_ice_candidate':
                    await this.handleWebRTCSignaling(ws, sessionId, type, data);
                    break;
                case 'update_stream_settings':
                    await this.handleUpdateStreamSettings(ws, sessionId, data);
                    break;
                case 'toggle_audio':
                    await this.handleToggleAudio(ws, sessionId, data.enabled);
                    break;
                case 'toggle_video':
                    await this.handleToggleVideo(ws, sessionId, data.enabled);
                    break;
                case 'apply_filter':
                    await this.handleApplyFilter(ws, sessionId, data);
                    break;
                case 'set_virtual_background':
                    await this.handleSetVirtualBackground(ws, sessionId, data);
                    break;
                case 'request_highlight':
                    await this.handleRequestHighlight(ws, sessionId, data);
                    break;
                case 'get_stream_analytics':
                    await this.handleGetAnalytics(ws, sessionId);
                    break;
                case 'pin_message':
                    await this.handlePinMessage(ws, sessionId, data.messageId);
                    break;
                case 'moderate_user':
                    await this.handleModerateUser(ws, sessionId, data);
                    break;
                default:
                    this.sendError(ws, `Unknown message type: ${type}`);
            }
        }
        catch (error) {
            console.error(`Error handling ${type}:`, error);
            this.sendError(ws, error instanceof Error ? error.message : 'Operation failed');
        }
    }
    // Authentication handler
    async handleAuthentication(ws, data) {
        const { userId, token } = data;
        // Verify user exists
        const user = await storage_1.storage.getUser(userId);
        if (!user) {
            return this.sendError(ws, 'Invalid user');
        }
        // In production, verify JWT token
        // For now, just set the userId
        ws.userId = userId;
        this.connections.set(userId, ws);
        this.sendMessage(ws, {
            type: 'authenticated',
            data: {
                userId,
                username: user.username,
                role: user.role
            }
        });
    }
    // Stream creation handler
    async handleCreateStream(ws, data) {
        if (!ws.userId) {
            return this.sendError(ws, 'Authentication required');
        }
        const session = await streaming_1.streamingService.createStream(ws.userId, data);
        ws.sessionId = session.id;
        this.sendMessage(ws, {
            type: 'stream_created',
            data: {
                sessionId: session.id,
                streamId: session.streamId,
                streamKey: session.streamKey,
                rtcConfiguration: session.rtcConfiguration
            }
        });
    }
    // Join stream handler
    async handleJoinStream(ws, sessionId, userId, data) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        ws.sessionId = sessionId;
        if (data.role === 'costar' || session.participants.has(userId)) {
            // Joining as participant
            const participant = session.participants.get(userId);
            if (participant) {
                participant.connection = ws;
            }
            // Check verification for co-stars
            if (data.role === 'costar') {
                const verification = await verification_1.verificationService.getUserVerificationStatus(userId);
                if (!verification.verified) {
                    return this.sendError(ws, 'Verification required to join as co-star');
                }
                await streaming_1.streamingService.addCoStar(sessionId, userId, true);
            }
            this.sendMessage(ws, {
                type: 'joined_as_participant',
                data: {
                    sessionId,
                    streamId: session.streamId,
                    participants: Array.from(session.participants.values()).map(p => ({
                        userId: p.userId,
                        username: p.username,
                        role: p.role,
                        isVerified: p.isVerified
                    })),
                    rtcConfiguration: session.rtcConfiguration
                }
            });
        }
        else {
            // Joining as viewer
            await streaming_1.streamingService.addViewer(sessionId, userId, ws);
            this.sendMessage(ws, {
                type: 'joined_as_viewer',
                data: {
                    sessionId,
                    streamId: session.streamId,
                    currentViewers: session.analytics.currentViewers,
                    streamStatus: session.status
                }
            });
        }
    }
    // Leave stream handler
    async handleLeaveStream(ws, sessionId, userId) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session)
            return;
        if (session.participants.has(userId)) {
            await streaming_1.streamingService.removeCoStar(sessionId, userId);
        }
        else {
            await streaming_1.streamingService.removeViewer(sessionId, userId);
        }
        ws.sessionId = undefined;
        this.sendMessage(ws, {
            type: 'left_stream',
            data: { sessionId }
        });
    }
    // Start stream handler
    async handleStartStream(ws, sessionId) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only host can start stream
        if (ws.userId !== session.creatorId) {
            return this.sendError(ws, 'Only host can start the stream');
        }
        await streaming_1.streamingService.startStream(sessionId);
        this.sendMessage(ws, {
            type: 'stream_started',
            data: {
                sessionId,
                startedAt: session.startedAt
            }
        });
    }
    // End stream handler
    async handleEndStream(ws, sessionId) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only host can end stream
        if (ws.userId !== session.creatorId) {
            return this.sendError(ws, 'Only host can end the stream');
        }
        await streaming_1.streamingService.endStream(sessionId);
        this.sendMessage(ws, {
            type: 'stream_ended',
            data: {
                sessionId,
                endedAt: session.endedAt,
                recordingAvailable: !!session.recordingUrl
            }
        });
    }
    // Invite co-star handler
    async handleInviteCoStar(ws, sessionId, data) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only host can invite co-stars
        if (ws.userId !== session.creatorId) {
            return this.sendError(ws, 'Only host can invite co-stars');
        }
        await streaming_1.streamingService.addCoStar(sessionId, data.userId, data.requireVerification !== false);
        // Notify invited user if connected
        const invitedWs = this.connections.get(data.userId);
        if (invitedWs) {
            this.sendMessage(invitedWs, {
                type: 'costar_invitation',
                data: {
                    sessionId,
                    streamId: session.streamId,
                    hostId: session.creatorId
                }
            });
        }
        this.sendMessage(ws, {
            type: 'costar_invited',
            data: { userId: data.userId }
        });
    }
    // Remove co-star handler
    async handleRemoveCoStar(ws, sessionId, coStarId) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only host can remove co-stars
        if (ws.userId !== session.creatorId) {
            return this.sendError(ws, 'Only host can remove co-stars');
        }
        await streaming_1.streamingService.removeCoStar(sessionId, coStarId);
        // Notify removed user
        const removedWs = this.connections.get(coStarId);
        if (removedWs) {
            this.sendMessage(removedWs, {
                type: 'removed_from_stream',
                data: { sessionId }
            });
        }
        this.sendMessage(ws, {
            type: 'costar_removed',
            data: { userId: coStarId }
        });
    }
    // Chat message handler
    async handleChatMessage(ws, sessionId, data) {
        if (!ws.userId)
            return;
        await streaming_1.streamingService.sendChatMessage(sessionId, ws.userId, data.message, data.messageType || 'text');
    }
    // Gift handler
    async handleGift(ws, sessionId, data) {
        if (!ws.userId)
            return;
        await streaming_1.streamingService.sendGift(sessionId, ws.userId, data.receiverId, data.giftType, data.giftValue, data.quantity || 1, data.message);
    }
    // Reaction handler
    async handleReaction(ws, sessionId, data) {
        if (!ws.userId)
            return;
        await streaming_1.streamingService.sendReaction(sessionId, ws.userId, data.reactionType, data.intensity || 1);
    }
    // WebRTC signaling handler
    async handleWebRTCSignaling(ws, sessionId, signalType, data) {
        if (!ws.userId)
            return;
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only participants can send WebRTC signals
        if (!session.participants.has(ws.userId)) {
            return this.sendError(ws, 'Not a participant in this stream');
        }
        await streaming_1.streamingService.handleSignaling(sessionId, ws.userId, Object.assign({ type: signalType }, data));
    }
    // Update stream settings handler
    async handleUpdateStreamSettings(ws, sessionId, data) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only host can update settings
        if (ws.userId !== session.creatorId) {
            return this.sendError(ws, 'Only host can update settings');
        }
        // Update settings in database
        await storage_1.storage.updateLiveStream(session.streamId, data);
        this.sendMessage(ws, {
            type: 'settings_updated',
            data
        });
    }
    // Toggle audio handler
    async handleToggleAudio(ws, sessionId, enabled) {
        if (!ws.userId)
            return;
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        const participant = session.participants.get(ws.userId);
        if (!participant) {
            return this.sendError(ws, 'Not a participant');
        }
        participant.audioEnabled = enabled;
        // Broadcast to all participants
        this.broadcastToParticipants(session, {
            type: 'audio_toggled',
            data: {
                userId: ws.userId,
                enabled
            }
        });
    }
    // Toggle video handler
    async handleToggleVideo(ws, sessionId, enabled) {
        if (!ws.userId)
            return;
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        const participant = session.participants.get(ws.userId);
        if (!participant) {
            return this.sendError(ws, 'Not a participant');
        }
        participant.videoEnabled = enabled;
        // Broadcast to all participants
        this.broadcastToParticipants(session, {
            type: 'video_toggled',
            data: {
                userId: ws.userId,
                enabled
            }
        });
    }
    // Apply filter handler
    async handleApplyFilter(ws, sessionId, data) {
        this.sendMessage(ws, {
            type: 'filter_applied',
            data: {
                filterType: data.filterType,
                settings: data.settings
            }
        });
    }
    // Set virtual background handler
    async handleSetVirtualBackground(ws, sessionId, data) {
        this.sendMessage(ws, {
            type: 'virtual_background_set',
            data
        });
    }
    // Request highlight handler
    async handleRequestHighlight(ws, sessionId, data) {
        var _a;
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session || session.status !== 'live') {
            return this.sendError(ws, 'Stream not active');
        }
        // Mark current moment as highlight
        const timestamp = Math.floor((Date.now() - (((_a = session.startedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0)) / 1000);
        await storage_1.storage.createStreamHighlight({
            streamId: session.streamId,
            title: data.title,
            startTime: Math.max(0, timestamp - (data.duration || 30)),
            endTime: timestamp + 30,
            highlightType: 'manual',
            score: 75
        });
        this.sendMessage(ws, {
            type: 'highlight_created',
            data: { timestamp }
        });
    }
    // Get analytics handler
    async handleGetAnalytics(ws, sessionId) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        this.sendMessage(ws, {
            type: 'analytics',
            data: session.analytics
        });
    }
    // Pin message handler
    async handlePinMessage(ws, sessionId, messageId) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only host/moderators can pin messages
        const participant = session.participants.get(ws.userId);
        if (!participant || (participant.role !== 'host' && participant.role !== 'moderator')) {
            return this.sendError(ws, 'Insufficient permissions');
        }
        const message = session.chatMessages.find(m => m.id === messageId);
        if (message) {
            message.isPinned = true;
            // Broadcast pinned message
            this.broadcastToSession(session, {
                type: 'message_pinned',
                data: { messageId }
            });
        }
    }
    // Moderate user handler
    async handleModerateUser(ws, sessionId, data) {
        const session = streaming_1.streamingService.getSession(sessionId);
        if (!session) {
            return this.sendError(ws, 'Stream not found');
        }
        // Only host/moderators can moderate
        const participant = session.participants.get(ws.userId);
        if (!participant || (participant.role !== 'host' && participant.role !== 'moderator')) {
            return this.sendError(ws, 'Insufficient permissions');
        }
        // Apply moderation action
        if (data.action === 'ban' || data.action === 'timeout') {
            await streaming_1.streamingService.removeViewer(sessionId, data.userId);
            // Notify banned user
            const bannedWs = this.connections.get(data.userId);
            if (bannedWs) {
                this.sendMessage(bannedWs, {
                    type: 'moderated',
                    data: {
                        action: data.action,
                        duration: data.duration
                    }
                });
                bannedWs.close();
            }
        }
        this.sendMessage(ws, {
            type: 'user_moderated',
            data
        });
    }
    // Disconnection handler
    handleDisconnection(ws) {
        if (ws.userId && ws.sessionId) {
            const session = streaming_1.streamingService.getSession(ws.sessionId);
            if (session) {
                if (session.participants.has(ws.userId)) {
                    // Participant disconnected
                    const participant = session.participants.get(ws.userId);
                    if (participant) {
                        participant.connection = undefined;
                    }
                }
                else {
                    // Viewer disconnected
                    streaming_1.streamingService.removeViewer(ws.sessionId, ws.userId);
                }
            }
            this.connections.delete(ws.userId);
        }
    }
    // Helper methods
    sendMessage(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(ws, error) {
        this.sendMessage(ws, {
            type: 'error',
            data: { error }
        });
    }
    broadcastToSession(session, message) {
        const messageStr = JSON.stringify(message);
        session.participants.forEach((participant) => {
            var _a;
            if (((_a = participant.connection) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.WebSocket.OPEN) {
                participant.connection.send(messageStr);
            }
        });
        session.viewers.forEach((viewer) => {
            var _a;
            if (((_a = viewer.connection) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.WebSocket.OPEN) {
                viewer.connection.send(messageStr);
            }
        });
    }
    broadcastToParticipants(session, message) {
        const messageStr = JSON.stringify(message);
        session.participants.forEach((participant) => {
            var _a;
            if (((_a = participant.connection) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.WebSocket.OPEN) {
                participant.connection.send(messageStr);
            }
        });
    }
    setupHeartbeat() {
        this.pingInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    ws.terminate();
                    return;
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // Ping every 30 seconds
    }
    // Cleanup
    cleanup() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.connections.clear();
    }
}
exports.StreamWebSocketHandler = StreamWebSocketHandler;
function initStreamWebSocketHandler(wss) {
    exports.streamWebSocketHandler = new StreamWebSocketHandler(wss);
    return exports.streamWebSocketHandler;
}
