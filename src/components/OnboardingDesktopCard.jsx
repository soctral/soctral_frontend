export default function Card({ imageSrc, altText, text }) {
    return (
      <div className="relative w-[358px] h-[358px] bg-newgray rounded-full flex items-center justify-center p-8">
        {/* Image */}
        <img
          src={imageSrc}
          alt={altText}
          className="mb-6 max-w-[179.51px] max-h-[200px] object-contain"
        />
        {/* Text */}
        <p className="absolute bottom-9 text-center leading-6 text-white text-xs w-[60%]">{text}</p>
      </div>
    );
  }
  