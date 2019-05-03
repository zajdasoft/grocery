/**
 * Collection provides protected array for storing items which are supposed to be often removed.
 * @constructor
 */
export default function Collection() {
  const array = [];

  /**
   * Add an item
   * @param {*} item Item to be added.
   * @return {Function}
   */
  this.add = (item) => {
    array.push(item);
    let protect = false;
    return () => {
      if (protect) return;
      protect = true;
      array.splice(array.indexOf(item), 1);
    };
  };

  /**
   * Get length of the collection.
   * @return {number}
   */
  this.length = () => array.length;

  /**
   * Get item at given position.
   * @param {number} index Item index.
   * @return {*} Stored item.
   */
  this.get = index => array[index];
}
