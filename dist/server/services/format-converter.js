"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatConverterService = exports.PLATFORM_CONFIGS = void 0;
const storage_1 = require("../storage");
const objectStorage_1 = require("../objectStorage");
// Platform configurations
exports.PLATFORM_CONFIGS = {
    tiktok: {
        id: 'tiktok',
        name: 'TikTok',
        aspectRatio: '9:16',
        maxDuration: 60,
        maxFileSize: 287,
        resolution: { width: 1080, height: 1920 },
        videoBitrate: 8000000,
        audioBitrate: 128000,
        fps: 30,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsGif: true,
            supportsLive: true,
        },
        optimizations: {
            autoLoop: true,
            addCaptions: true,
            verticalOptimized: true,
            mobileFirst: true,
        },
    },
    instagram_reels: {
        id: 'instagram_reels',
        name: 'Instagram Reels',
        aspectRatio: '9:16',
        maxDuration: 90,
        maxFileSize: 100,
        resolution: { width: 1080, height: 1920 },
        videoBitrate: 5000000,
        audioBitrate: 128000,
        fps: 30,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsGif: true,
        },
        optimizations: {
            addCaptions: true,
            verticalOptimized: true,
            mobileFirst: true,
        },
    },
    instagram_post: {
        id: 'instagram_post',
        name: 'Instagram Post',
        aspectRatio: '1:1',
        maxDuration: 60,
        maxFileSize: 100,
        resolution: { width: 1080, height: 1080 },
        videoBitrate: 3500000,
        audioBitrate: 128000,
        fps: 30,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsCarousel: true,
            supportsGif: true,
        },
        optimizations: {
            mobileFirst: true,
        },
    },
    instagram_feed: {
        id: 'instagram_feed',
        name: 'Instagram Feed',
        aspectRatio: '4:5',
        maxDuration: 60,
        maxFileSize: 100,
        resolution: { width: 1080, height: 1350 },
        videoBitrate: 3500000,
        audioBitrate: 128000,
        fps: 30,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsCarousel: true,
        },
        optimizations: {
            mobileFirst: true,
        },
    },
    youtube_shorts: {
        id: 'youtube_shorts',
        name: 'YouTube Shorts',
        aspectRatio: '9:16',
        maxDuration: 60,
        maxFileSize: 128,
        resolution: { width: 1080, height: 1920 },
        videoBitrate: 10000000,
        audioBitrate: 192000,
        fps: 60,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsHDR: true,
        },
        optimizations: {
            verticalOptimized: true,
            addEndScreen: true,
        },
    },
    youtube: {
        id: 'youtube',
        name: 'YouTube',
        aspectRatio: '16:9',
        maxDuration: 43200, // 12 hours
        maxFileSize: 128000, // 128GB
        resolution: { width: 1920, height: 1080 },
        videoBitrate: 15000000,
        audioBitrate: 320000,
        fps: 60,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsHDR: true,
            supportsChapters: true,
            supportsLive: true,
        },
        optimizations: {
            addEndScreen: true,
            addCaptions: true,
        },
    },
    twitter: {
        id: 'twitter',
        name: 'Twitter/X',
        aspectRatio: '16:9',
        maxDuration: 140,
        maxFileSize: 512,
        resolution: { width: 1280, height: 720 },
        videoBitrate: 5000000,
        audioBitrate: 128000,
        fps: 30,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsGif: true,
        },
        optimizations: {
            mobileFirst: true,
        },
    },
    onlyfans: {
        id: 'onlyfans',
        name: 'OnlyFans',
        aspectRatio: '16:9',
        maxDuration: 600,
        maxFileSize: 5000,
        resolution: { width: 1920, height: 1080 },
        videoBitrate: 10000000,
        audioBitrate: 192000,
        fps: 30,
        codec: 'h264',
        format: 'mp4',
        features: {
            supportsLive: true,
        },
        optimizations: {
            addCaptions: false,
        },
    },
};
class FormatConverterService {
    constructor() {
        this.conversionQueue = new Map();
        this.objectStorage = new objectStorage_1.ObjectStorageService();
    }
    // Convert content to multiple platform formats
    async convertToFormats(sessionId, options) {
        const session = await storage_1.storage.getContentSession(sessionId);
        if (!session)
            throw new Error('Session not found');
        const results = [];
        // Process each platform in parallel
        const conversionPromises = options.platforms.map(async (platformId) => {
            const config = exports.PLATFORM_CONFIGS[platformId];
            if (!config) {
                console.warn(`Unknown platform: ${platformId}`);
                return null;
            }
            return this.convertForPlatform(session, config, options);
        });
        const conversions = await Promise.all(conversionPromises);
        for (const result of conversions) {
            if (result) {
                results.push(result);
            }
        }
        return results;
    }
    // Convert content for specific platform
    async convertForPlatform(session, config, options) {
        const startTime = Date.now();
        console.log(`Converting content for ${config.name} (${config.aspectRatio})`);
        // Apply platform-specific conversions
        const convertedContent = await this.applyPlatformConversion(session, config, options);
        // Optimize for platform requirements
        const optimizedContent = await this.optimizeForPlatform(convertedContent, config, options);
        // Generate platform-specific metadata
        const metadata = this.generatePlatformMetadata(config, session);
        // Upload converted version
        const filename = `${config.id}_${config.aspectRatio.replace(':', 'x')}.${config.format}`;
        const uploadKey = `content/${session.creatorId}/${session.id}/platforms/${filename}`;
        const uploadResult = await this.objectStorage.uploadObject({
            key: uploadKey,
            body: optimizedContent,
            contentType: `video/${config.format}`,
            metadata: Object.assign({ sessionId: session.id, platform: config.id, aspectRatio: config.aspectRatio }, metadata),
        });
        // Generate preview if requested
        let previewUrl;
        if (options.generatePreview) {
            previewUrl = await this.generatePreview(session, config);
        }
        // Create content version record
        const versionData = {
            sessionId: session.id,
            aspectRatio: config.aspectRatio,
            format: config.format,
            resolution: `${config.resolution.height}p`,
            fileUrl: uploadResult.url,
            thumbnailUrl: previewUrl,
            fileSize: optimizedContent.byteLength,
            dimensions: config.resolution,
            isProcessed: true,
            metadata: {
                platform: config.id,
                platformConfig: config,
                conversionOptions: options,
            },
        };
        const version = await storage_1.storage.createContentVersion(versionData);
        const processingTime = Date.now() - startTime;
        return {
            platform: config.id,
            version,
            optimizedSize: optimizedContent.byteLength,
            processingTime,
            previewUrl,
        };
    }
    // Apply platform-specific conversion
    async applyPlatformConversion(session, config, options) {
        // In production: Use FFmpeg for actual conversion
        // This would handle:
        // 1. Aspect ratio conversion with smart cropping
        // 2. Resolution scaling
        // 3. Frame rate adjustment
        // 4. Duration trimming if needed
        // 5. Codec conversion
        let convertedContent = Buffer.from(`converted_${config.id}_content`);
        // Apply aspect ratio conversion
        convertedContent = await this.convertAspectRatio(convertedContent, config.aspectRatio, config.resolution);
        // Trim to max duration if needed
        if (config.maxDuration < 43200) {
            convertedContent = await this.trimDuration(convertedContent, config.maxDuration);
        }
        // Apply platform-specific optimizations
        if (config.optimizations.verticalOptimized) {
            convertedContent = await this.optimizeForVertical(convertedContent);
        }
        if (config.optimizations.addCaptions && options.quality !== 'low') {
            convertedContent = await this.addAutoCaptions(convertedContent);
        }
        if (config.optimizations.addEndScreen && config.id === 'youtube') {
            convertedContent = await this.addYouTubeEndScreen(convertedContent);
        }
        if (config.optimizations.autoLoop && config.id === 'tiktok') {
            convertedContent = await this.makeLoopable(convertedContent);
        }
        return convertedContent;
    }
    // Optimize content for platform
    async optimizeForPlatform(content, config, options) {
        let optimized = content;
        // Compress to meet file size requirements
        if (config.maxFileSize) {
            optimized = await this.compressToSize(optimized, config.maxFileSize);
        }
        // Apply bitrate optimization
        optimized = await this.optimizeBitrate(optimized, config.videoBitrate, config.audioBitrate);
        // Mobile optimization
        if (options.optimizeForMobile && config.optimizations.mobileFirst) {
            optimized = await this.optimizeForMobile(optimized);
        }
        // Apply quality settings
        optimized = await this.applyQualitySettings(optimized, options.quality);
        return optimized;
    }
    // Helper methods for conversion
    async convertAspectRatio(content, targetRatio, resolution) {
        // In production: Use FFmpeg with smart cropping
        // Detect faces/subjects and keep them in frame
        console.log(`Converting to ${targetRatio} at ${resolution.width}x${resolution.height}`);
        return content;
    }
    async trimDuration(content, maxDuration) {
        // In production: Trim video to max duration
        console.log(`Trimming to ${maxDuration} seconds`);
        return content;
    }
    async optimizeForVertical(content) {
        // Apply vertical video optimizations
        console.log('Optimizing for vertical viewing');
        return content;
    }
    async addAutoCaptions(content) {
        // In production: Generate and burn in captions
        console.log('Adding auto-generated captions');
        return content;
    }
    async addYouTubeEndScreen(content) {
        // Add YouTube end screen elements
        console.log('Adding YouTube end screen');
        return content;
    }
    async makeLoopable(content) {
        // Create seamless loop for TikTok
        console.log('Making content loopable');
        return content;
    }
    async compressToSize(content, maxSizeMB) {
        // In production: Use variable bitrate encoding to meet size limit
        console.log(`Compressing to ${maxSizeMB}MB`);
        return content;
    }
    async optimizeBitrate(content, videoBitrate, audioBitrate) {
        // In production: Apply specific bitrate settings
        console.log(`Optimizing bitrate: video=${videoBitrate}, audio=${audioBitrate}`);
        return content;
    }
    async optimizeForMobile(content) {
        // Apply mobile-specific optimizations
        console.log('Optimizing for mobile devices');
        return content;
    }
    async applyQualitySettings(content, quality) {
        // Apply quality presets
        console.log(`Applying ${quality} quality settings`);
        return content;
    }
    async generatePreview(session, config) {
        // Generate platform-specific preview/thumbnail
        const previewKey = `content/${session.creatorId}/${session.id}/previews/${config.id}_preview.jpg`;
        // In production: Extract representative frame or generate animated preview
        const previewBuffer = Buffer.from('preview_placeholder');
        const result = await this.objectStorage.uploadObject({
            key: previewKey,
            body: previewBuffer,
            contentType: 'image/jpeg',
            metadata: {
                sessionId: session.id,
                platform: config.id,
            },
        });
        return result.url;
    }
    generatePlatformMetadata(config, session) {
        return {
            platformId: config.id,
            platformName: config.name,
            aspectRatio: config.aspectRatio,
            maxDuration: config.maxDuration,
            features: config.features,
            optimizations: config.optimizations,
            convertedAt: new Date().toISOString(),
        };
    }
    // Batch conversion for multiple sessions
    async batchConvert(sessionIds, options) {
        const results = new Map();
        // Process in parallel with concurrency limit
        const concurrencyLimit = 3;
        const chunks = this.chunkArray(sessionIds, concurrencyLimit);
        for (const chunk of chunks) {
            const chunkResults = await Promise.all(chunk.map(async (sessionId) => {
                try {
                    const conversions = await this.convertToFormats(sessionId, options);
                    return { sessionId, conversions };
                }
                catch (error) {
                    console.error(`Batch conversion failed for ${sessionId}:`, error);
                    return { sessionId, conversions: [] };
                }
            }));
            for (const result of chunkResults) {
                results.set(result.sessionId, result.conversions);
            }
        }
        return results;
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    // Get supported platforms for content type
    getSupportedPlatforms(contentType) {
        return Object.values(exports.PLATFORM_CONFIGS).filter(config => {
            // Filter based on content type
            if (contentType === 'short' && config.maxDuration > 90) {
                return false;
            }
            if (contentType === 'long' && config.maxDuration < 300) {
                return false;
            }
            return true;
        });
    }
    // Get optimal platforms for content
    getOptimalPlatforms(duration, aspectRatio) {
        return Object.values(exports.PLATFORM_CONFIGS)
            .filter(config => config.maxDuration >= duration &&
            (config.aspectRatio === aspectRatio || this.canConvertRatio(aspectRatio, config.aspectRatio)))
            .map(config => config.id);
    }
    canConvertRatio(from, to) {
        var _a;
        // Check if aspect ratio conversion is feasible without major cropping
        const ratioMap = {
            '16:9': ['16:9', '1:1', '4:5'],
            '9:16': ['9:16', '1:1', '4:5'],
            '1:1': ['1:1', '4:5'],
            '4:5': ['4:5', '1:1'],
        };
        return ((_a = ratioMap[from]) === null || _a === void 0 ? void 0 : _a.includes(to)) || false;
    }
}
exports.FormatConverterService = FormatConverterService;
