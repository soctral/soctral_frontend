export default function Card({ imageSrc, altText, text, headeer }) {
    return (
        <>
<div className="w-full">
<div className="mx-auto px-6">
        <h2 className="text-left leading-6 text-white text-2xl mb-[11px] font-bold">{headeer}</h2>
        <div className=" w-[322px]">
        <p className="text-left leading-6 text-white text-xs mb-[1rem]">{text}</p>

        </div>
        </div>
        
        <div className="rounded-full flex flex-col mx-auto px-[2.8rem] items-center justify-center" >
     
        {/* Image */}
        <img
          src={imageSrc}
          alt={altText}
          className="w-[206.42px] h-[202.85px] object-contain"
        />
      </div>
</div>
       
        </>

    );
  }
  