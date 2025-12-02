'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  Upload,
  Download,
  FileText,
  Image,
  Video,
  File,
  Link,
  Copy,
  Eye,
  Trash2,
  HardDrive,
  Cloud,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface IPFSFile {
  id: string;
  cid: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  metadata?: {
    description?: string;
    tags?: string[];
    category?: string;
  };
  url: string;
  gatewayUrl: string;
  pinned: boolean;
}

export default function IPFSPage() {
  const { address, isConnected } = useWallet();
  const [files, setFiles] = useState<IPFSFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    description: '',
    tags: '',
    category: 'document'
  });

  useEffect(() => {
    if (isConnected && address) {
      loadIPFSFiles();
    }
  }, [isConnected, address]);

  const loadIPFSFiles = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockFiles: IPFSFile[] = [
        {
          id: '1',
          cid: 'QmYwAPJzv5CZsnAztEC3MzPJpPd4z6c3j2YvH2YvH2YvH2',
          name: 'farm_data_2024.json',
          size: 245760,
          type: 'application/json',
          uploadedAt: Date.now() - 86400000 * 2,
          metadata: {
            description: 'Q1 2024 farm yield data',
            tags: ['yield', 'corn', '2024'],
            category: 'farm-data'
          },
          url: 'ipfs://QmYwAPJzv5CZsnAztEC3MzPJpPd4z6c3j2YvH2YvH2YvH2',
          gatewayUrl: 'https://ipfs.io/ipfs/QmYwAPJzv5CZsnAztEC3MzPJpPd4z6c3j2YvH2YvH2YvH2',
          pinned: true
        },
        {
          id: '2',
          cid: 'QmX5YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2',
          name: 'soil_analysis_report.pdf',
          size: 1843200,
          type: 'application/pdf',
          uploadedAt: Date.now() - 86400000 * 5,
          metadata: {
            description: 'Comprehensive soil analysis for field A1',
            tags: ['soil', 'analysis', 'field-a1'],
            category: 'document'
          },
          url: 'ipfs://QmX5YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2',
          gatewayUrl: 'https://ipfs.io/ipfs/QmX5YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2',
          pinned: true
        },
        {
          id: '3',
          cid: 'QmZ8YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2',
          name: 'satellite_image_2024.jpg',
          size: 5242880,
          type: 'image/jpeg',
          uploadedAt: Date.now() - 86400000 * 7,
          metadata: {
            description: 'High-resolution satellite image of farm fields',
            tags: ['satellite', 'image', 'fields'],
            category: 'image'
          },
          url: 'ipfs://QmZ8YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2',
          gatewayUrl: 'https://ipfs.io/ipfs/QmZ8YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2YvH2',
          pinned: false
        }
      ];

      setFiles(mockFiles);
    } catch (error) {
      console.error('Failed to load IPFS files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Mock upload - in production, this would upload to IPFS via API
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newFile: IPFSFile = {
        id: Date.now().toString(),
        cid: `Qm${Math.random().toString(36).substring(2, 15)}`,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        uploadedAt: Date.now(),
        metadata: {
          description: uploadMetadata.description,
          tags: uploadMetadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          category: uploadMetadata.category
        },
        url: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}`,
        gatewayUrl: `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substring(2, 15)}`,
        pinned: true
      };

      setFiles(prev => [newFile, ...prev]);
      setUploadProgress(100);

      // Reset form
      setSelectedFile(null);
      setUploadMetadata({ description: '', tags: '', category: 'document' });
      setShowUploadModal(false);

      setTimeout(() => setUploadProgress(0), 1000);

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could show a toast notification here
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-green-600" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5 text-red-600" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' ||
                       (filterType === 'images' && file.type.startsWith('image/')) ||
                       (filterType === 'documents' && (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('json'))) ||
                       (filterType === 'other' && !file.type.startsWith('image/') && !file.type.includes('pdf') && !file.type.includes('document') && !file.type.includes('json'));

    return matchesSearch && matchesType;
  });

  const totalStorage = files.reduce((sum, file) => sum + file.size, 0);
  const pinnedFiles = files.filter(file => file.pinned).length;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <HardDrive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            IPFS Storage
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to access decentralized file storage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">IPFS Storage</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Decentralized file storage for your agricultural data and documents
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Files</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{files.length}</p>
              </div>
              <File className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(totalStorage)}</p>
              </div>
              <HardDrive className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pinned Files</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pinnedFiles}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Network Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
              </div>
              <Cloud className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search files by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="images">Images</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </select>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>
        </div>

        {/* Files List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(file.type)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                              {file.cid.slice(0, 10)}...{file.cid.slice(-6)}
                            </div>
                            {file.metadata?.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {file.metadata.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {file.metadata?.category || 'file'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {file.pinned ? (
                            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Pinned
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Cached
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(file.gatewayUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(file.url)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Copy IPFS URL"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(file.gatewayUrl)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Copy Gateway URL"
                          >
                            <Link className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No files found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filters.' : 'Upload your first file to get started.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Upload to IPFS
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={uploadMetadata.description}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, description: e.target.value})}
                    placeholder="Brief description of the file"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={uploadMetadata.tags}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, tags: e.target.value})}
                    placeholder="Comma-separated tags (e.g., yield, corn, 2024)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadMetadata.category}
                    onChange={(e) => setUploadMetadata({...uploadMetadata, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="data">Data</option>
                    <option value="video">Video</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}