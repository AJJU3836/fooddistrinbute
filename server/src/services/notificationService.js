/**
 * Notification service — wraps Socket.io emitter calls so routes
 * don't need to import `io` directly.
 */
let _io = null;

export const setIO = (io) => { _io = io; };

export const notify = {
  /** Broadcast new food listing to all NGOs */
  newFood: (foodDoc, donorName) => {
    _io?.to('ngos').emit('food:new', {
      food: foodDoc,
      donorName,
      message: `New food available: ${foodDoc.foodType} (${foodDoc.quantity} ${foodDoc.unit})`,
      timestamp: new Date(),
    });
  },

  /** Notify a specific donor that their food was claimed */
  foodClaimed: (donorId, data) => {
    _io?.to(`user:${donorId}`).emit('food:claimed', {
      ...data,
      message: `Your listing "${data.foodType}" has been claimed by ${data.ngoName}`,
      timestamp: new Date(),
    });
  },

  /** Broadcast status change to donor, ngo, and admin rooms */
  statusUpdate: (assignment, food) => {
    const payload = {
      assignmentId: assignment._id,
      foodId: food._id,
      foodType: food.foodType,
      status: assignment.status,
      timestamp: new Date(),
    };
    _io?.to(`user:${assignment.donorId}`).emit('food:status', payload);
    _io?.to(`user:${assignment.ngoId}`).emit('food:status', payload);
    _io?.to('admins').emit('food:status', payload);
  },

  /** Push analytics refresh to admin room */
  analyticsUpdate: (metrics) => {
    _io?.to('admins').emit('analytics:update', { metrics, timestamp: new Date() });
  },
};
