"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipfsStorageService = exports.IPFSStorageService = void 0;
const ipfs_http_client_1 = require("ipfs-http-client");
const db_1 = require("../../db");
const schema_1 = require("../../../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const buffer_1 = require("buffer");
// IPFS configuration
const IPFS_CONFIG = {
    host: process.env.IPFS_HOST || 'ipfs.infura.io',
    port: process.env.IPFS_PORT || 5001,
    protocol: process.env.IPFS_PROTOCOL || 'https',
    headers: {
        authorization: process.env.INFURA_IPFS_AUTH || ''
    }
};
// Public gateways for fetching IPFS content
const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/'
];
class IPFSStorageService {
    constructor() {
        try {
            // Initialize IPFS client
            this.client = (0, ipfs_http_client_1.create)({
                host: IPFS_CONFIG.host,
                port: Number(IPFS_CONFIG.port),
                protocol: IPFS_CONFIG.protocol,
                headers: IPFS_CONFIG.headers
            });
            // Pinata credentials for pinning (optional)
            this.pinataApiKey = process.env.PINATA_API_KEY;
            this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
        }
        catch (error) {
            console.error('Error initializing IPFS client:', error);
            // Fallback to local/mock mode
            this.client = null;
        }
    }
    // Upload file to IPFS
    async uploadFile(file, fileName, userId) {
        try {
            if (!this.client) {
                // Mock mode for development
                const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
                await this.recordUpload({
                    userId,
                    ipfsHash: mockHash,
                    fileName,
                    fileType: this.getFileType(fileName),
                    fileSize: buffer_1.Buffer.isBuffer(file) ? file.length : file.length,
                    contentType: 'file'
                });
                return {
                    ipfsHash: mockHash,
                    ipfsUrl: `ipfs://${mockHash}`,
                    gatewayUrl: `${IPFS_GATEWAYS[0]}${mockHash}`
                };
            }
            // Upload to IPFS
            const result = await this.client.add(file, {
                pin: true,
                progress: (prog) => console.log(`IPFS upload progress: ${prog}`)
            });
            const ipfsHash = result.cid.toString();
            // Pin with Pinata if configured
            if (this.pinataApiKey && this.pinataSecretKey) {
                await this.pinWithPinata(ipfsHash, fileName);
            }
            // Record in database
            await this.recordUpload({
                userId,
                ipfsHash,
                fileName,
                fileType: this.getFileType(fileName),
                fileSize: buffer_1.Buffer.isBuffer(file) ? file.length : file.length,
                contentType: 'file'
            });
            return {
                ipfsHash,
                ipfsUrl: `ipfs://${ipfsHash}`,
                gatewayUrl: `${IPFS_GATEWAYS[0]}${ipfsHash}`
            };
        }
        catch (error) {
            console.error('Error uploading to IPFS:', error);
            throw error;
        }
    }
    // Upload JSON metadata to IPFS
    async uploadMetadata(metadata, userId, tokenId) {
        try {
            const metadataString = JSON.stringify(metadata, null, 2);
            const metadataBuffer = buffer_1.Buffer.from(metadataString);
            if (!this.client) {
                // Mock mode for development
                const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
                await this.recordUpload({
                    userId,
                    tokenId,
                    ipfsHash: mockHash,
                    fileName: 'metadata.json',
                    fileType: 'json',
                    fileSize: metadataBuffer.length,
                    contentType: 'metadata'
                });
                return {
                    ipfsHash: mockHash,
                    ipfsUrl: `ipfs://${mockHash}`,
                    gatewayUrl: `${IPFS_GATEWAYS[0]}${mockHash}`
                };
            }
            // Upload to IPFS
            const result = await this.client.add(metadataBuffer, {
                pin: true
            });
            const ipfsHash = result.cid.toString();
            // Pin with Pinata if configured
            if (this.pinataApiKey && this.pinataSecretKey) {
                await this.pinWithPinata(ipfsHash, 'metadata.json');
            }
            // Record in database
            await this.recordUpload({
                userId,
                tokenId,
                ipfsHash,
                fileName: 'metadata.json',
                fileType: 'json',
                fileSize: metadataBuffer.length,
                contentType: 'metadata'
            });
            return {
                ipfsHash,
                ipfsUrl: `ipfs://${ipfsHash}`,
                gatewayUrl: `${IPFS_GATEWAYS[0]}${ipfsHash}`
            };
        }
        catch (error) {
            console.error('Error uploading metadata to IPFS:', error);
            throw error;
        }
    }
    // Upload directory to IPFS (for collections)
    async uploadDirectory(files, userId) {
        var _a, e_1, _b, _c;
        try {
            if (!this.client) {
                // Mock mode
                const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
                const mockFiles = files.map(file => ({
                    path: file.path,
                    hash: `Qm${Math.random().toString(36).substr(2, 44)}`,
                    size: buffer_1.Buffer.isBuffer(file.content) ? file.content.length : file.content.length
                }));
                return {
                    rootHash: mockHash,
                    files: mockFiles
                };
            }
            const uploadFiles = files.map(file => ({
                path: file.path,
                content: file.content
            }));
            const results = [];
            try {
                for (var _d = true, _e = __asyncValues(this.client.addAll(uploadFiles, {
                    wrapWithDirectory: true,
                    pin: true
                })), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const result = _c;
                    results.push(result);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            const rootResult = results.find(r => r.path === '');
            const rootHash = rootResult ? rootResult.cid.toString() : '';
            const fileResults = results
                .filter(r => r.path !== '')
                .map(r => ({
                path: r.path,
                hash: r.cid.toString(),
                size: r.size
            }));
            // Record uploads
            for (const file of fileResults) {
                await this.recordUpload({
                    userId,
                    ipfsHash: file.hash,
                    fileName: file.path,
                    fileType: this.getFileType(file.path),
                    fileSize: file.size,
                    contentType: 'collection'
                });
            }
            return {
                rootHash,
                files: fileResults
            };
        }
        catch (error) {
            console.error('Error uploading directory to IPFS:', error);
            throw error;
        }
    }
    // Fetch content from IPFS
    async fetchFromIPFS(ipfsHash) {
        var _a, e_2, _b, _c;
        try {
            if (!this.client) {
                // Try fetching from public gateway in mock mode
                const gatewayUrl = `${IPFS_GATEWAYS[0]}${ipfsHash}`;
                const response = await fetch(gatewayUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch from IPFS gateway: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                return buffer_1.Buffer.from(arrayBuffer);
            }
            const chunks = [];
            try {
                for (var _d = true, _e = __asyncValues(this.client.cat(ipfsHash)), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const chunk = _c;
                    chunks.push(chunk);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return buffer_1.Buffer.concat(chunks);
        }
        catch (error) {
            console.error('Error fetching from IPFS:', error);
            // Fallback to gateway fetch
            return await this.fetchFromGateway(ipfsHash);
        }
    }
    // Fetch from IPFS gateway
    async fetchFromGateway(ipfsHash) {
        for (const gateway of IPFS_GATEWAYS) {
            try {
                const url = `${gateway}${ipfsHash}`;
                const response = await fetch(url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    return buffer_1.Buffer.from(arrayBuffer);
                }
            }
            catch (error) {
                continue; // Try next gateway
            }
        }
        throw new Error('Failed to fetch from any IPFS gateway');
    }
    // Pin content with Pinata
    async pinWithPinata(ipfsHash, name) {
        if (!this.pinataApiKey || !this.pinataSecretKey) {
            return;
        }
        try {
            const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                },
                body: JSON.stringify({
                    hashToPin: ipfsHash,
                    pinataMetadata: {
                        name,
                        keyvalues: {
                            platform: 'girlfanz',
                            timestamp: Date.now()
                        }
                    }
                })
            });
            if (!response.ok) {
                console.error('Failed to pin with Pinata:', await response.text());
            }
        }
        catch (error) {
            console.error('Error pinning with Pinata:', error);
        }
    }
    // Unpin content from IPFS
    async unpinContent(ipfsHash) {
        try {
            if (!this.client) {
                return;
            }
            await this.client.pin.rm(ipfsHash);
            // Update database
            await db_1.db.update(schema_1.ipfsRecords)
                .set({ isPinned: false })
                .where((0, drizzle_orm_1.eq)(schema_1.ipfsRecords.ipfsHash, ipfsHash));
        }
        catch (error) {
            console.error('Error unpinning content:', error);
        }
    }
    // Record IPFS upload in database
    async recordUpload(data) {
        const [record] = await db_1.db.insert(schema_1.ipfsRecords)
            .values(data)
            .returning();
        return record;
    }
    // Get user's IPFS uploads
    async getUserUploads(userId) {
        return await db_1.db.select()
            .from(schema_1.ipfsRecords)
            .where((0, drizzle_orm_1.eq)(schema_1.ipfsRecords.userId, userId));
    }
    // Get file type from filename
    getFileType(fileName) {
        var _a;
        const extension = ((_a = fileName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        const typeMap = {
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'webp': 'image',
            'mp4': 'video',
            'webm': 'video',
            'mov': 'video',
            'avi': 'video',
            'mp3': 'audio',
            'wav': 'audio',
            'ogg': 'audio',
            'json': 'json',
            'txt': 'text',
            'pdf': 'document'
        };
        return typeMap[extension] || 'unknown';
    }
    // Generate NFT metadata
    generateNFTMetadata(data) {
        return {
            name: data.name,
            description: data.description,
            image: data.image,
            attributes: data.attributes || [],
            properties: data.properties || {},
            external_url: data.external_url || '',
            animation_url: data.animation_url || ''
        };
    }
    // Encrypt content before upload (for token-gated access)
    async encryptContent(content, encryptionKey) {
        try {
            // Simple XOR encryption for demo (use proper encryption in production)
            const encrypted = buffer_1.Buffer.alloc(content.length);
            const keyBuffer = buffer_1.Buffer.from(encryptionKey);
            for (let i = 0; i < content.length; i++) {
                encrypted[i] = content[i] ^ keyBuffer[i % keyBuffer.length];
            }
            return encrypted;
        }
        catch (error) {
            console.error('Error encrypting content:', error);
            throw error;
        }
    }
    // Decrypt content after fetch
    async decryptContent(encryptedContent, encryptionKey) {
        try {
            // Simple XOR decryption (same as encryption for XOR)
            return await this.encryptContent(encryptedContent, encryptionKey);
        }
        catch (error) {
            console.error('Error decrypting content:', error);
            throw error;
        }
    }
    // Get IPFS gateway URL
    getGatewayUrl(ipfsHash, gateway = 0) {
        return `${IPFS_GATEWAYS[gateway]}${ipfsHash}`;
    }
    // Convert IPFS URI to HTTP gateway URL
    ipfsToHttp(ipfsUri) {
        if (ipfsUri.startsWith('ipfs://')) {
            const hash = ipfsUri.replace('ipfs://', '');
            return this.getGatewayUrl(hash);
        }
        return ipfsUri;
    }
    // Check if content is pinned
    async isPinned(ipfsHash) {
        try {
            const [record] = await db_1.db.select()
                .from(schema_1.ipfsRecords)
                .where((0, drizzle_orm_1.eq)(schema_1.ipfsRecords.ipfsHash, ipfsHash))
                .limit(1);
            return (record === null || record === void 0 ? void 0 : record.isPinned) || false;
        }
        catch (error) {
            console.error('Error checking pin status:', error);
            return false;
        }
    }
    // Calculate storage costs (for billing)
    calculateStorageCost(sizeInBytes, durationDays) {
        // $0.01 per GB per day (example pricing)
        const gbSize = sizeInBytes / (1024 * 1024 * 1024);
        const dailyCost = 0.01;
        return gbSize * dailyCost * durationDays;
    }
}
exports.IPFSStorageService = IPFSStorageService;
// Export singleton instance
exports.ipfsStorageService = new IPFSStorageService();
