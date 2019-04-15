/**
 * Simple observable implementation.
 * @constructor
 */
export default function Observable(thisArg) {
  this.observers = [];
  /**
   * Subscribe for the event.
   * @param {Function} call Event handler.
   * @returns {Function} Unsubscribe call.
   */
  this.subscribe = (call) => {
    if (typeof call !== 'function') throw Error('Subscribe takes only one callable argument.');

    const bound = call.bind(thisArg || this);
    this.observers.push(bound);
    return () => {
      this.observers.splice(this.observers.indexOf(bound), 1);
    };
  };

  /**
   * Publish an event.
   * @param args Arguments to pass.
   */
  this.publish = (...args) => {
    this.observers.forEach(item => item(...args));
  };
}
