import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import DataService from './services/DataService.jsx';

const ImageUpload = ({
  onImagesChange,
  maxImages = 5,
  existingImages = [],
  category = 'general'
}) => {
  const [selectedImages, setSelectedImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (selectedImages.length + files.length > maxImages) {
      setUploadError(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }
    setUploadError('');
    await uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    const newImages = [];
    for (const file of files) {
      try {
        const uploadResult = await DataService.uploadImage(file, category);
        if (uploadResult.success) {
          newImages.push({
            name: file.name,
            size: file.size,
            url: uploadResult.data.url,
            serverId: uploadResult.data.id
          });
        } else {
          throw new Error(uploadResult.message || 'Upload failed');
        }
      } catch (error) {
        setUploadError(prev => prev + `Failed to upload ${file.name}. `);
      }
    }
    const updatedImages = [...selectedImages, ...newImages];
    setSelectedImages(updatedImages);
    if (onImagesChange) {
      onImagesChange(updatedImages);
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const triggerFileSelect = () => {
    if (!uploading && selectedImages.length < maxImages) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
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
              {uploading ? 'Uploading...' :
               selectedImages.length >= maxImages ? 'Maximum images reached' :
               'Click to upload images'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PNG, JPG, WebP up to 5MB each ({selectedImages.length}/{maxImages})
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{uploadError}</p>
          <button onClick={() => setUploadError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Uploaded Images ({selectedImages.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedImages.map((item, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                  {/* --- FIX STARTS HERE --- */}
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.url}`}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* --- FIX ENDS HERE --- */}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
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
    </div>
  );
};

export default ImageUpload;