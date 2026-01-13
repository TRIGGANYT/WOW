import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Teamup } from './teamup';

describe('Teamup', () => {
  let component: Teamup;
  let fixture: ComponentFixture<Teamup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Teamup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Teamup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
