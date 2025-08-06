import React from "react";
interface  IDotProps {
    color? : string
    radio? : number;
}
export default function DotPulse(props: IDotProps) {
    const {color, radio} = props
    return (
        <div className="flex justify-center p-2">
            <div
                className="dot-pulse"
                style={{
                    position: 'relative',
                    left: '-9999px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '5px',
                    backgroundColor: color || 'white',
                    color:  color || 'white',
                    boxShadow: '9999px 0 0 -5px',
                    animation: 'dot-pulse 1.5s infinite linear',
                    animationDelay: '0.25s',
                }}
            ></div>
            <style>
                {`
          .dot-pulse::before, .dot-pulse::after {
            content: "";
            display: inline-block;
            position: absolute;
            top: 0;
            width: ${(radio || 5) * 2}px;
            height: ${(radio || 5) * 2}px;
            border-radius: ${(radio || 5) }px;
            background-color: ${color || 'white'}
            color:  ${color || 'white'}
          }
          .dot-pulse::before {
            box-shadow: 9984px 0 0 -5px;
            animation: dot-pulse-before 1.5s infinite linear;
            animation-delay: 0s;
          }
          .dot-pulse::after {
            box-shadow: 10014px 0 0 -5px;
            animation: dot-pulse-after 1.5s infinite linear;
            animation-delay: 0.5s;
          }

          @keyframes dot-pulse-before {
            0% {
              box-shadow: 9984px 0 0 -5px;
            }
            30% {
              box-shadow: 9984px 0 0 2px;
            }
            60%, 100% {
              box-shadow: 9984px 0 0 -5px;
            }
          }
          @keyframes dot-pulse {
            0% {
              box-shadow: 9999px 0 0 -5px;
            }
            30% {
              box-shadow: 9999px 0 0 2px;
            }
            60%, 100% {
              box-shadow: 9999px 0 0 -5px;
            }
          }
          @keyframes dot-pulse-after {
            0% {
              box-shadow: 10014px 0 0 -5px;
            }
            30% {
              box-shadow: 10014px 0 0 2px;
            }
            60%, 100% {
              box-shadow: 10014px 0 0 -5px;
            }
          }
        `}
            </style>
        </div>
    );
}
