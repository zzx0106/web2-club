'use strict';

const Service = require('egg').Service;
class OtherServer extends Service {
    findAllTabs() {
        return this.ctx.model.Other.findOne({}, { _id: 0, tabs: 1 }).exec();
    }
    findTabByName(tab) {
        return this.ctx.model.Other.findOne({ 'tabs.name': tab }).exec();
    }
    findTopicByTabId(tabId) {
        return this.ctx.model.Other.find({}, { tabs: { $elemMatch: { _id: tabId } } }).exec();
    }
}
module.exports = OtherServer;
