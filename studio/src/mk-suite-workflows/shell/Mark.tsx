import React from 'react';
export const Mark:React.FC<{size?:number;color?:string;draw?:number}>=({size=100,color='#EE6045',draw=1})=><svg width={size} height={size} viewBox="0 0 100 100"><path d="M12 76V24L34 54L54 24V76M57 51L88 24M57 51L88 76" fill="none" stroke={color} strokeWidth="9" strokeLinejoin="miter" pathLength="1" strokeDasharray="1" strokeDashoffset={1-draw}/></svg>;
