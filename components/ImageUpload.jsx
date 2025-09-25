import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import DataService from './services/DataService.jsx';
const ImageUpload = ({ 
  onImagesChange, 
  maxImages = 5, 
  existingImages = [],
  category = 'general' // cars, tours, general
}) => {
  const [selectedImages, setSelectedImages] = useState(existingImages);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (selectedImages.length + files.length > maxImages) {
      setUploadError(`You can only upload a maximum of ${maxImages} images to the database`);
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setUploadError('Please select only JPEG, PNG, or WebP images for database upload');
      return;
    }

    // Validate file sizes (5MB max per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setUploadError('Each image must be smaller than 5MB for database storage');
      return;
    }

    // Clear any previous errors
    setUploadError('');

    // Upload files to database
    await uploadFiles(files);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload files to database via DataService
  const uploadFiles = async (files) => {
    setUploading(true);
    const newImages = [];
    const newPreviews = [];
    const errors = [];

    console.log(`📤 Starting upload of ${files.length} images to database at 2025-09-03 17:08:57`);
    console.log('👤 Current User: BlueDrinkingWater');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${Date.now()}-${i}`;
      
      try {
        // Update progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Upload to database using DataService
        const uploadResult = await DataService.uploadImage(file, category);
        
        if (uploadResult.success) {
          // Add to images array
          const imageData = {
            id: fileId,
            name: file.name,
            size: file.size,
            url: uploadResult.data.url || uploadResult.data.path,
            serverId: uploadResult.data.id || uploadResult.data._id,
            uploadedAt: new Date().toISOString(),
            category: category,
            storedInDatabase: true
          };

          newImages.push(imageData);

          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push({
              ...imageData,
              preview: e.target.result
            });
            
            if (newPreviews.length === files.length - errors.length) {
              setPreviews(prev => [...prev, ...newPreviews]);
            }
          };
          reader.readAsDataURL(file);

          // Update progress to 100%
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

          console.log(`✅ Image uploaded to database: ${file.name} at 2025-09-03 17:08:57`);
        } else {
          throw new Error(uploadResult.message || 'Database upload failed');
        }
      } catch (error) {
        console.error(`❌ Database upload error for ${file.name}:`, error);
        errors.push(`${file.name}: ${error.message}`);
        
        // Remove from progress
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      setUploadError(`Database upload failed for some files:\n${errors.join('\n')}`);
    }

    // Update state with successfully uploaded images
    if (newImages.length > 0) {
      const updatedImages = [...selectedImages, ...newImages];
      setSelectedImages(updatedImages);

      // Call parent callback
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }

      console.log(`✅ Successfully uploaded ${newImages.length} images to database`);
    }

    setUploading(false);
  };

  // Remove image from database
  const removeImage = async (index) => {
    const imageToRemove = selectedImages[index];
    
    // If image was uploaded to database, delete it
    if (imageToRemove.serverId) {
      try {
        await DataService.deleteImage(imageToRemove.serverId);
        console.log(`🗑️ Image deleted from database: ${imageToRemove.name} at 2025-09-03 17:08:57`);
      } catch (error) {
        console.error('❌ Error deleting image from database:', error);
        setUploadError(`Failed to delete ${imageToRemove.name} from database: ${error.message}`);
        return; // Don't remove from UI if database deletion failed
      }
    }

    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setSelectedImages(newImages);
    setPreviews(newPreviews);
    
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  // Trigger file input click
  const triggerFileSelect = () => {
    if (fileInputRef.current && !uploading && selectedImages.length < maxImages) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={triggerFileSelect}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          uploading || selectedImages.length >= maxImages
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || selectedImages.length >= maxImages}
        />
        
        <div className="space-y-4">
          <div className="text-gray-400 text-4xl">
            {uploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            ) : (
              <ImageIcon className="w-12 h-12 mx-auto" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {uploading ? 'Uploading to database...' : 
               selectedImages.length >= maxImages ? 'Maximum images reached' : 
               'Click to upload images to database'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PNG, JPG, WebP up to 5MB each (max {maxImages} images in database)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {selectedImages.length}/{maxImages} images stored in database
            </p>
          </div>
          {!uploading && selectedImages.length < maxImages && (
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload to Database
            </button>
          )}
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Database Upload Error</p>
            <p className="text-sm whitespace-pre-line">{uploadError}</p>
          </div>
          <button
            onClick={() => setUploadError('')}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Database Upload Progress</h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          ))}
        </div>
      )}

      {/* Image Previews */}
      {(previews.length > 0 || selectedImages.length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Images in Database ({Math.max(previews.length, selectedImages.length)}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(previews.length > 0 ? previews : selectedImages).map((item, index) => (
              <div key={item.id || index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-green-200">
                  <img
                    src={item.preview || `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.url}`}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/300';
                    }}
                  />
                </div>
                
                {/* Image Info */}
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.uploadedAt && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      In Database
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                  title="Remove from database"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Primary Image Indicator */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Main
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {selectedImages.length === 0 && !uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Database Upload Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Upload high-quality images directly to our secure MongoDB database</li>
            <li>• The first image will be used as the main image</li>
            <li>• Include diverse shots and clear, well-lit photos</li>
            <li>• Ensure images clearly show important details</li>
            <li>• All images are stored securely in the database with encryption</li>
            <li>• Current time: 2025-09-03 17:08:57</li>
          </ul>
        </div>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && selectedImages.length > 0 && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">🔧 Debug Info:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>User: BlueDrinkingWater</p>
            <p>Category: {category}</p>
            <p>Database Images: {selectedImages.length}/{maxImages}</p>
            <p>Backend URL: {process.env.REACT_APP_API_URL || 'http://localhost:5000'}</p>
            <p>MongoDB Storage: Active</p>
            <p>Last update: 2025-09-03 17:08:57</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;