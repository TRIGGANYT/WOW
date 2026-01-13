import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Aicoach } from './aicoach';

describe('Aicoach', () => {
  let component: Aicoach;
  let fixture: ComponentFixture<Aicoach>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aicoach]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Aicoach);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
