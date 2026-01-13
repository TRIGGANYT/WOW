import { ComponentFixture, TestBed } from '@angular/core/testing';

import { chat } from './chat';

describe('Chat', () => {
  let component: chat;
  let fixture: ComponentFixture<chat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [chat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(chat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
