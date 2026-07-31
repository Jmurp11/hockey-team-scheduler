import { RequestBudget, BudgetExceededError } from './request-budget';

describe('RequestBudget', () => {
  it('accumulates spend across calls', () => {
    const b = new RequestBudget(100);
    b.add(30);
    b.add(20);
    expect(b.spent()).toBe(50);
  });

  it('does not throw while under budget', () => {
    const b = new RequestBudget(100);
    b.add(99);
    expect(() => b.assertWithinBudget()).not.toThrow();
  });

  it('throws BudgetExceededError once the budget is reached', () => {
    const b = new RequestBudget(100);
    b.add(100);
    expect(() => b.assertWithinBudget()).toThrow(BudgetExceededError);
  });

  it('treats nullish/negative token counts as zero', () => {
    const b = new RequestBudget(100);
    b.add(undefined);
    b.add(null as unknown as number);
    b.add(-5);
    expect(b.spent()).toBe(0);
  });
});
