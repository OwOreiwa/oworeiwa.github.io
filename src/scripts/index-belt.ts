export const initIndexBelt = () => {
  const belt = document.querySelector(".belt");
  const beltTrack = belt?.querySelector(".belt-track");
  if (!(belt instanceof HTMLElement) || !(beltTrack instanceof HTMLElement)) {
    return;
  }

  const singleSetHTML = beltTrack.innerHTML;

  let loopWidth = 0;
  let offsetX = 0;
  let velocityX = -0.6; // -0.6
  const baseVelocity = -0.2; // -0.2
  const maxVelocity = 4;
  const dragResistance = 0.94;
  const hoverStopResistance = 0.98;
  const autoResumeBlend = 0.02;
  const minInertiaVelocity = 0.03;
  let isHovering = false;
  let isDragging = false;
  let isHoverInertiaActive = false;
  let lastPointerX = 0;
  let animationId = 0;
  let isTicking = false;
  let lastRenderedX = Number.NaN;

  const normalizeOffset = () => {
    if (loopWidth <= 0) {
      return;
    }
    offsetX %= loopWidth;
    if (offsetX > 0) {
      offsetX -= loopWidth;
    }
    if (offsetX <= -loopWidth) {
      offsetX += loopWidth;
    }
  };

  const clampVelocity = () => {
    if (velocityX > maxVelocity) velocityX = maxVelocity;
    if (velocityX < -maxVelocity) velocityX = -maxVelocity;
  };

  const tick = () => {
    if (!isDragging && !isHovering) {
      offsetX += velocityX;
      velocityX += (baseVelocity - velocityX) * autoResumeBlend;
    } else if (!isDragging && isHoverInertiaActive) {
      offsetX += velocityX;
      velocityX *= hoverStopResistance;
      if (Math.abs(velocityX) < minInertiaVelocity) {
        velocityX = 0;
        isHoverInertiaActive = false;
      }
    }

    normalizeOffset();
    if (offsetX !== lastRenderedX) {
      beltTrack.style.transform = `translate3d(${offsetX}px, 0, 0)`;
      lastRenderedX = offsetX;
    }
    animationId = requestAnimationFrame(tick);
  };

  const startTicking = () => {
    if (isTicking) {
      return;
    }
    isTicking = true;
    animationId = requestAnimationFrame(tick);
  };

  const stopTicking = () => {
    if (!isTicking) {
      return;
    }
    cancelAnimationFrame(animationId);
    isTicking = false;
  };

  const rebuildTrack = () => {
    beltTrack.innerHTML = singleSetHTML;
    loopWidth = beltTrack.scrollWidth;

    if (loopWidth <= 0) {
      return;
    }

    const minTrackWidth = loopWidth + belt.clientWidth;
    let safety = 0;
    while (beltTrack.scrollWidth < minTrackWidth && safety < 20) {
      beltTrack.innerHTML += singleSetHTML;
      safety += 1;
    }
    normalizeOffset();
  };

  const onResize = () => {
    rebuildTrack();
  };

  const beginHover = () => {
    if (isDragging) {
      return;
    }
    isHovering = true;
    isHoverInertiaActive = true;
  };

  const endHover = () => {
    isHovering = false;
    isHoverInertiaActive = false;
  };

  belt.addEventListener("pointerenter", beginHover);
  belt.addEventListener("pointerleave", endHover);
  belt.addEventListener("mouseenter", beginHover);
  belt.addEventListener("mouseleave", endHover);

  belt.addEventListener("pointerdown", (event) => {
    isDragging = true;
    isHovering = false;
    isHoverInertiaActive = false;
    lastPointerX = event.clientX;
    velocityX = 0;
    startTicking();
    belt.classList.add("is-dragging");
    belt.setPointerCapture(event.pointerId);
  });

  belt.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }
    const deltaX = event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    offsetX += deltaX;
    velocityX = deltaX;
    clampVelocity();
    normalizeOffset();
  });

  const endDrag = (event: PointerEvent) => {
    if (!isDragging) {
      return;
    }
    isDragging = false;
    isHovering = belt.matches(":hover");
    isHoverInertiaActive = false;
    belt.classList.remove("is-dragging");
    if (belt.hasPointerCapture(event.pointerId)) {
      belt.releasePointerCapture(event.pointerId);
    }
  };

  belt.addEventListener("pointerup", endDrag);
  belt.addEventListener("pointercancel", endDrag);

  rebuildTrack();
  window.addEventListener("resize", onResize);
  startTicking();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopTicking();
      return;
    }
    startTicking();
  });

  window.addEventListener("beforeunload", () => {
    stopTicking();
  });
};
