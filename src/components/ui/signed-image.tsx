import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import React from "react";

interface SignedAvatarProps {
  src: string | null | undefined;
  fallback: React.ReactNode;
  className?: string;
}

export const SignedAvatar: React.FC<SignedAvatarProps> = ({ src, fallback, className }) => {
  const signedSrc = useSignedUrl(src);

  return (
    <Avatar className={className}>
      <AvatarImage src={signedSrc} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};

interface SignedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storedUrl: string | null | undefined;
}

export const SignedImage: React.FC<SignedImageProps> = ({ storedUrl, ...props }) => {
  const signedSrc = useSignedUrl(storedUrl);

  if (!signedSrc) return null;

  return <img {...props} src={signedSrc} />;
};
