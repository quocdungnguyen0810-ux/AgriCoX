"use client";

import Image from "next/image";
import { Leaf } from "lucide-react";
import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function ProductImage({ src, alt, className = "", priority = false }: ProductImageProps) {
  const [error, setError] = useState(false);

  if (error || !src || src.startsWith("/images/project") || src.startsWith("/images/substrate") || src.startsWith("/images/growbag-rau") || src.startsWith("/images/block-5kg")) {
    return (
      <div className={`bg-gradient-to-br from-green-50 to-brown-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Leaf size={48} className="text-green-300 mx-auto mb-2" />
          <span className="text-xs text-gray-400">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        onError={() => setError(true)}
      />
    </div>
  );
}
