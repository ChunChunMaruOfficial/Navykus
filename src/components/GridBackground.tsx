const GridBackground = () => (
  <div id="grid-background-system" className="absolute inset-0 pointer-events-none z-0">
    <div
      className="absolute inset-0 opacity-[0.25]"
      style={{
        backgroundImage:
          'linear-gradient(#d8d1cc 1px, transparent 1px), linear-gradient(90deg, #d8d1cc 1px, transparent 1px)',
        backgroundSize: '120px 120px',
      }}
    />
    <div className="absolute left-[8%] top-0 bottom-0 w-[1px] bg-[#d8d1cc] opacity-30" />
    <div className="absolute right-[8%] top-0 bottom-0 w-[1px] bg-[#d8d1cc] opacity-30" />
  </div>
);

export default GridBackground;
