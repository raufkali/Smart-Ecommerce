// components/BackendImage.jsx
import NextImage from "next/image";

const BackendImage = ({ src, alt, className, ...props }) => {
  return (
    <NextImage
      src={src}
      alt={alt}
      className={className}
      unoptimized={true} // skips optimizer = no private IP check
      {...props}
    />
  );
};

export default BackendImage;
