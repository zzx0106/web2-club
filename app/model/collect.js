'use strict';

module.exports = (app) => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
    const ObjectId = Schema.ObjectId;

    const CollectSchema = new Schema({
        user_id: { type: ObjectId },
        topic_id: { type: ObjectId },
        create_at: { type: Date, default: Date.now },
    });

    CollectSchema.index({ user_id: 1, topic_id: 1 }, { unique: true });

    return mongoose.model('Collect', CollectSchema);
};
