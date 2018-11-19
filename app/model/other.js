'use strict';
module.exports = (app) => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
    const ObjectId = Schema.ObjectId;

    const OtherSchema = new Schema({
        tabs: [
            // 分类列表
            {
                name: '', // 分类名称
                hot: 0, // 分类热度
                topic_ids: [], //
                create_at: { type: Date },
            },
        ],
    });
    return mongoose.model('Other', OtherSchema);
};
