"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Camera, Loader2, Check, AlertCircle } from "lucide-react";
import { compressImage } from "@/lib/image-compressor";
import { updateUserAvatar } from "@/app/actions/user-avatar";

interface AvatarUploaderProps {
  currentImage?: string | null;
  name: string;
  size?: "md" | "lg";
}

export default function AvatarUploader({ currentImage, name, size = "lg" }: AvatarUploaderProps) {
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getInitials = (str: string) => {
    const parts = str.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset messages
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP...).");
      return;
    }

    try {
      setIsUploading(true);

      // Compress image client-side before upload (~5 KB - 15 KB output)
      const compressedDataUrl = await compressImage(file, 250, 250, 0.75);

      // Instant optimistic local preview
      setImagePreview(compressedDataUrl);

      // Send to server
      const result = await updateUserAvatar(compressedDataUrl);

      if (!result.success || !result.image) {
        throw new Error(result.error || "Cập nhật ảnh đại diện thất bại.");
      }

      // Update NextAuth session without passing heavy base64 strings to cookie
      await updateSession({ image: undefined });

      setSuccessMsg("Đã cập nhật avatar thành công!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setErrorMsg(err.message || "Lỗi khi xử lý hình ảnh.");
      setImagePreview(currentImage || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isLarge = size === "lg";
  const avatarSizeClasses = isLarge
    ? "w-24 h-24 rounded-3xl"
    : "w-16 h-16 rounded-2xl";
  const fontSizeClasses = isLarge ? "text-3xl" : "text-xl";

  const displayImage = imagePreview || currentImage;

  return (
    <div className="relative inline-block group">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Avatar Container */}
      <div
        className={`${avatarSizeClasses} bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-2xl overflow-hidden relative transition-all duration-300 group-hover:border-white/60 cursor-pointer`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        title="Bấm để thay đổi ảnh đại diện"
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`${fontSizeClasses} font-black text-white`}>
            {getInitials(name)}
          </span>
        )}

        {/* Hover overlay with camera prompt */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1">
          <Camera className="w-5 h-5 text-white" />
          <span>Tải ảnh</span>
        </div>

        {/* Loading Spinner Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white z-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
          </div>
        )}
      </div>

      {/* Camera trigger badge button */}
      <button
        type="button"
        onClick={() => !isUploading && fileInputRef.current?.click()}
        disabled={isUploading}
        aria-label="Tải ảnh đại diện mới"
        className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-2 border-indigo-900 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Notification Toast Messages */}
      {successMsg && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap z-20 animate-fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap z-20 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
