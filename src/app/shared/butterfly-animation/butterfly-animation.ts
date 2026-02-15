import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PathPoint {
  x: number;
  y: number;
  time: number; // Time in ms to reach this point
}

@Component({
  selector: 'app-butterfly-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './butterfly-animation.html',
  styleUrl: './butterfly-animation.css'
})
export class ButterflyAnimation implements OnInit, OnDestroy {
  @Input() targetSelector: string = '#teamup-nav-link';
  @Output() animationComplete = new EventEmitter<void>();

  isVisible = false;
  isArriving = false;
  isParked = false; // Butterfly is parked at destination as notification badge
  currentX = 0;
  currentY = 0;
  currentRotation = 0; // Rotation in degrees based on flight direction

  private animationFrameId: number | null = null;
  private startTime = 0;
  private readonly ANIMATION_DURATION = 30000; // 30 seconds - gemütlich und gelassen
  private path: PathPoint[] = [];
  private isAnimating = false;
  private prevX = 0;
  private prevY = 0;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.startAnimation();
  }

  ngOnDestroy() {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startAnimation() {
    // Get target position
    const targetElement = document.querySelector(this.targetSelector);
    if (!targetElement) {
      console.warn('Target element not found:', this.targetSelector);
      this.animationComplete.emit();
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2 - 40; // Center butterfly
    const targetY = targetRect.top + targetRect.height / 2 - 40;

    // Generate random start position (from edges of screen)
    const startPosition = this.getRandomStartPosition();
    this.currentX = startPosition.x;
    this.currentY = startPosition.y;

    // Generate random path with loops and circles
    this.path = this.generateOrganicPath(startPosition.x, startPosition.y, targetX, targetY);

    // Start animation
    this.isVisible = true;
    this.isAnimating = true;
    this.startTime = performance.now();
    
    // Run animation outside Angular zone for better performance
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private getRandomStartPosition(): { x: number; y: number } {
    const side = Math.floor(Math.random() * 4);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    switch (side) {
      case 0: // Top
        return { x: Math.random() * viewportWidth, y: -80 };
      case 1: // Right
        return { x: viewportWidth + 80, y: Math.random() * viewportHeight };
      case 2: // Bottom
        return { x: Math.random() * viewportWidth, y: viewportHeight + 80 };
      case 3: // Left
      default:
        return { x: -80, y: Math.random() * viewportHeight };
    }
  }

  private generateOrganicPath(startX: number, startY: number, endX: number, endY: number): PathPoint[] {
    const points: PathPoint[] = [];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    
    // Fixed number of waypoints for consistent dramatic path
    const numWaypoints = 25;
    const timePerSegment = this.ANIMATION_DURATION / numWaypoints;

    // Start point (from random edge)
    points.push({ x: startX, y: startY, time: 0 });

    // Create dramatic swooping path like in the screenshot:
    // 1. Swoop down to the left side
    // 2. Big loop at bottom left
    // 3. Cross up through center
    // 4. Large loop on the right side
    // 5. Final approach to target
    
    const phases = [
      // Phase 1: Initial descent - swoop down left (0-15%)
      { endProgress: 0.15, targetX: viewportWidth * 0.2, targetY: viewportHeight * 0.6 },
      // Phase 2: Bottom left loop (15-35%)
      { endProgress: 0.35, targetX: viewportWidth * 0.15, targetY: viewportHeight * 0.85, isLoop: true, loopDir: 1 },
      // Phase 3: Rise up and cross to right (35-50%)
      { endProgress: 0.50, targetX: viewportWidth * 0.5, targetY: viewportHeight * 0.35 },
      // Phase 4: Right side large loop (50-75%)
      { endProgress: 0.75, targetX: viewportWidth * 0.85, targetY: viewportHeight * 0.7, isLoop: true, loopDir: -1 },
      // Phase 5: Up towards target (75-90%)
      { endProgress: 0.90, targetX: viewportWidth * 0.75, targetY: viewportHeight * 0.15 },
      // Phase 6: Final approach (90-100%)
      { endProgress: 1.0, targetX: endX, targetY: endY }
    ];

    let currentPhase = 0;
    let phaseStartX = startX;
    let phaseStartY = startY;
    let phaseStartProgress = 0;
    
    for (let i = 1; i < numWaypoints; i++) {
      const progress = i / numWaypoints;
      
      // Find current phase
      while (currentPhase < phases.length - 1 && progress > phases[currentPhase].endProgress) {
        phaseStartX = phases[currentPhase].targetX;
        phaseStartY = phases[currentPhase].targetY;
        phaseStartProgress = phases[currentPhase].endProgress;
        currentPhase++;
      }
      
      const phase = phases[currentPhase];
      const phaseProgress = (progress - phaseStartProgress) / (phase.endProgress - phaseStartProgress);
      
      // Base position with easing
      const eased = this.easeInOutSine(phaseProgress);
      let x = phaseStartX + (phase.targetX - phaseStartX) * eased;
      let y = phaseStartY + (phase.targetY - phaseStartY) * eased;
      
      // Add looping motion for loop phases
      if (phase.isLoop) {
        const loopRadius = Math.min(viewportWidth, viewportHeight) * 0.2;
        const loopAngle = phaseProgress * Math.PI * 2.5; // More than full circle for spiral effect
        const loopScale = 1 - phaseProgress * 0.3; // Shrink slightly as we exit loop
        x += Math.cos(loopAngle * phase.loopDir!) * loopRadius * loopScale;
        y += Math.sin(loopAngle) * loopRadius * 0.8 * loopScale;
      }
      
      // Add some organic waviness
      const waveX = Math.sin(progress * Math.PI * 6) * 30 * (1 - progress);
      const waveY = Math.cos(progress * Math.PI * 4) * 20 * (1 - progress);
      x += waveX;
      y += waveY;
      
      // Small random jitter for natural feel
      x += (Math.random() - 0.5) * 20;
      y += (Math.random() - 0.5) * 15;
      
      // Keep within viewport
      const margin = 40;
      x = Math.max(margin, Math.min(viewportWidth - margin, x));
      y = Math.max(margin, Math.min(viewportHeight - margin, y));
      
      points.push({
        x: x,
        y: y,
        time: i * timePerSegment
      });
    }

    // End point - exact target position
    points.push({ x: endX, y: endY, time: this.ANIMATION_DURATION });

    return points;
  }

  private animate = () => {
    if (!this.isAnimating) return;
    
    const elapsed = performance.now() - this.startTime;

    if (elapsed >= this.ANIMATION_DURATION) {
      // Animation complete - park butterfly at destination as notification badge
      this.currentX = this.path[this.path.length - 1].x;
      this.currentY = this.path[this.path.length - 1].y;
      this.currentRotation = 0; // Reset rotation when parked
      this.isArriving = true;
      this.isParked = true;
      this.isAnimating = false;

      // Update view to show parked state
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
      return;
    }

    // Check if arriving (last 15%)
    if (elapsed >= this.ANIMATION_DURATION * 0.85) {
      this.isArriving = true;
    }

    // Find current segment
    let segmentIndex = 0;
    for (let i = 0; i < this.path.length - 1; i++) {
      if (elapsed >= this.path[i].time && elapsed < this.path[i + 1].time) {
        segmentIndex = i;
        break;
      }
    }

    // Interpolate position within segment using easing
    const segmentStart = this.path[segmentIndex];
    const segmentEnd = this.path[segmentIndex + 1];
    const segmentProgress = (elapsed - segmentStart.time) / (segmentEnd.time - segmentStart.time);

    // Smooth easing function
    const easedProgress = this.easeInOutSine(segmentProgress);

    this.currentX = segmentStart.x + (segmentEnd.x - segmentStart.x) * easedProgress;
    this.currentY = segmentStart.y + (segmentEnd.y - segmentStart.y) * easedProgress;

    // Add small flutter offset
    const flutterX = Math.sin(elapsed * 0.01) * 5;
    const flutterY = Math.cos(elapsed * 0.015) * 3;
    this.currentX += flutterX;
    this.currentY += flutterY;

    // Calculate rotation angle based on movement direction
    const deltaX = this.currentX - this.prevX;
    const deltaY = this.currentY - this.prevY;
    if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
      // Calculate angle in degrees, offset by 90 because butterfly image points up
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      // Smooth the rotation to avoid jerky movements
      this.currentRotation = this.currentRotation + (angle - this.currentRotation) * 0.15;
    }
    this.prevX = this.currentX;
    this.prevY = this.currentY;

    // Trigger change detection to update view
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  // Called when user clicks on the butterfly (during flight or parked)
  onButterflyClick() {
    this.isVisible = false;
    this.isParked = false;
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationComplete.emit();
    // Navigate to Team-Up page
    this.router.navigate(['/teamup']);
  }

  // Called externally to dismiss the butterfly (e.g., when navigating to Team-Up)
  dismiss() {
    this.isVisible = false;
    this.isParked = false;
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationComplete.emit();
  }
}
