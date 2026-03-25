import logoImage from '@/assets/img/logo.png';

function MainLogo({ className = "", size = 40 }) {
    return (
        <div 
            className={`inline-flex items-center justify-center gap-[0.125em] text-brand ${className}`}
            style={{ fontSize: `${size}px` }}
        >
            <img 
                src={logoImage} 
                alt={'Logo Image'} 
                className='h-[1em] w-auto object-contain' 
            />
            <span className='font-bold leading-none text-[1em] flex-center-center'>CLIENT</span>
        </div>
    );
}

export default MainLogo;