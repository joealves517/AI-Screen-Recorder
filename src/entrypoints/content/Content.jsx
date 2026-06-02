import React, { useState, useContext, useEffect, useRef } from "react";

import Wrapper from "./Wrapper";

import ContentState from "./context/ContentState";

const Content = () => {
  return (
    <div className="aisr-shadow-dom">
      <ContentState>
        <Wrapper />
      </ContentState>
      <style type="text/css">{`
			#aisr-ui, #aisr-ui div {
				background-color: unset;
				padding: unset;
				width: unset;
				box-shadow: unset;
				display: unset;
				margin: unset;
				border-radius: unset;
			}
			.aisr-outline {
				position: absolute;
				z-index: 99999999999;
				border: 2px solid #3080F8;
				outline-offset: -2px;
				pointer-events: none;
				border-radius: 5px!important;
			}
		.aisr-blur {
			filter: blur(10px)!important;
		}
			.aisr-shadow-dom * {
				transition: unset;
			}
			.aisr-shadow-dom .TooltipContent {
  border-radius: 30px!important;
	background-color: #ffffff!important;
  border: 1px solid rgba(0, 0, 0, 0.08)!important;
  padding: 10px 15px!important;
  font-size: 12px;
	margin-bottom: 10px!important;
	bottom: 100px;
  line-height: 1;
	font-family: 'Satoshi-Medium', sans-serif;
	z-index: 99999999!important;
  color: #1f2937!important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)!important;
  user-select: none;
	transition: opacity 0.3 ease-in-out;
  will-change: transform, opacity;
	animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.aisr-shadow-dom .hide-tooltip {
	display: none!important;
}

.aisr-shadow-dom .tooltip-tall {
	margin-bottom: 20px;
}

.aisr-shadow-dom .tooltip-small {
	margin-bottom: 5px;
}

.aisr-shadow-dom .TooltipContent[data-state='delayed-open'][data-side='top'] {
	animation-name: aisr-slideDownAndFade;
}
.aisr-shadow-dom .TooltipContent[data-state='delayed-open'][data-side='right'] {
  animation-name: aisr-slideLeftAndFade;
}
.aisr-shadow-dom.TooltipContent[data-state='delayed-open'][data-side='bottom'] {
  animation-name: aisr-slideUpAndFade;
}
.aisr-shadow-dom.TooltipContent[data-state='delayed-open'][data-side='left'] {
  animation-name: aisr-slideRightAndFade;
}

@keyframes aisr-slideUpAndFade {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes aisr-slideRightAndFade {
  from { opacity: 0; transform: translateX(-2px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes aisr-slideDownAndFade {
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes aisr-slideLeftAndFade {
  from { opacity: 0; transform: translateX(2px); }
  to   { opacity: 1; transform: translateX(0); }
}

#aisr-ui [data-radix-popper-content-wrapper] { z-index: 999999999999!important; }

.aisr-shadow-dom .CanvasContainer {
	position: fixed;
	pointer-events: all!important;
	top: 0px!important;
	left: 0px!important;
	z-index: 99999999999!important;
}
.aisr-shadow-dom .canvas {
	position: fixed;
	top: 0px!important;
	left: 0px!important;
	z-index: 99999999999!important;
	background: transparent!important;
}
.aisr-shadow-dom .canvas-container {
	top: 0px!important;
	left: 0px!important;
	z-index: 99999999999;
	position: fixed!important;
	background: transparent!important;
}

.AisrDropdownMenuContent {
	z-index: 99999999999!important;
  min-width: 200px;
  background-color: #ffffff!important;
  background: #ffffff!important;
  backdrop-filter: none!important;
  -webkit-backdrop-filter: none!important;
  margin-top: 4px;
  margin-right: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  border-radius: 15px;
  font-family: 'Satoshi-Medium', sans-serif;
  color: #29292F;
  box-shadow: none !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
.AisrDropdownMenuContent[data-side="top"] {
  animation-name: aisr-slideDownAndFade;
}
.AisrDropdownMenuContent[data-side="right"] {
  animation-name: aisr-slideLeftAndFade;
}
.AisrDropdownMenuContent[data-side="bottom"] {
  animation-name: aisr-slideUpAndFade;
}
.AisrDropdownMenuContent[data-side="left"] {
  animation-name: aisr-slideRightAndFade;
}
.AisrItemIndicator {
  position: absolute;
  right: 12px;
  width: 18px;
  height: 18px;
  background: #3080F8;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.AisrItemIndicator svg,
.AisrItemIndicator svg *,
.AisrItemIndicator path {
  color: #ffffff!important;
  stroke: #ffffff!important;
  fill: none!important;
}
.AisrDropdownMenuItem,
.AisrDropdownMenuRadioItem {
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 5px;
  position: relative;
  padding-left: 22px;
  padding-right: 22px;
  user-select: none;
  outline: none;
}
.AisrDropdownMenuItem:hover {
    background-color: #F6F7FB !important;
    cursor: pointer;
}
.AisrDropdownMenuItem[data-disabled] {
  color: #6E7684 !important;
  cursor: not-allowed;
  background-color: #F6F7FB !important;
}

`}</style>
    </div>
  );
};

export default Content;
