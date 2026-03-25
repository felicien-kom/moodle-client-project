const FranceFlag = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className={className}>
        <path fill="#EC1920" d="M0 0h3v2H0z"/>
        <path fill="#fff" d="M0 0h2v2H0z"/>
        <path fill="#051440" d="M0 0h1v2H0z"/>
    </svg>
);
const USAFlag = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 7410 3900" className={className}>
        <path fill="#b22234" d="M0 0h7410v3900H0z"/>
        <path d="M0 450h7410m0 600H0m0 600h7410m0 600H0m0 600h7410m0 600H0" stroke="#fff" strokeWidth="300"/>
        <path fill="#3c3b6e" d="M0 0h2964v2100H0z"/>
        <g fill="#fff"><g id="d"><g id="c"><g id="e"><g id="b">
        <path id="a" d="M247 90l70.534 217.082-184.66-134.164h228.253L176.466 307.082z"/>
        <use xlinkHref="#a" y="420"/><use xlinkHref="#a" y="840"/>
        <use xlinkHref="#a" y="1260"/></g><use xlinkHref="#a" y="1680"/></g>
        <use xlinkHref="#b" x="247" y="210"/></g><use xlinkHref="#c" x="494"/></g>
        <use xlinkHref="#d" x="988"/><use xlinkHref="#c" x="1976"/>
        <use xlinkHref="#e" x="2470"/></g>
    </svg>
);
const ContrastTheme = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" className={className}>
        <path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM520-163q119-15 199.5-104.5T800-480q0-123-80.5-212.5T520-797v634Z"/>
    </svg>
);

export { FranceFlag, USAFlag, ContrastTheme };