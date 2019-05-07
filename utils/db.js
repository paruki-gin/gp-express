const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const dbAddress = require("../config/index");
class Db {
    static getInstance() {
        if (!Db.instance) {
            Db.instance = new Db();
        }
        return Db.instance;
    }
    constructor() {
        /* dbclient定义数据库是否存在 */
        this.dbClient = '';
        this.connect();
    }
    connect() {
        return new Promise((resolve, reject) => {
            /* dbClient数据库不存在,则连接数据库*/
            if (!this.dbClient) {
                MongoClient.connect(dbAddress, {
                    useNewUrlParser: true
                }, (err, client) => {
                    if (err) {
                        reject(err)
                    } else {
                        let db = client.db('gpbase')
                        this.dbClient = db;
                        resolve(this.dbClient)
                    };
                })
            } else {
                /* 数据存在,则resolve */
                resolve(this.dbClient)
            }
        })

    }
    find(collectionName, json) {
        return new Promise((resolve, reject) => {
            this.connect().then(db => {
                var result = db.collection(collectionName).find(json);
                result.toArray((err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                })
            })
        })

    }
    update(collectionName,myquery,newValue) {
        return new Promise((resolve,reject)=>{
            this.connect().then(db=>{
                db.collection(collectionName).updateOne(myquery,{$set:newValue},(err,data)=>{
                    if(err) reject(err);
                    else resolve(data);
                })
            })
        })
    }
    insert(collectionName,json) {
        return new Promise((resolve,reject)=>{
            this.connect().then(db=>{
                db.collection(collectionName).insertOne(json,(err,data)=>{
                    if(err) reject(err);
                    else resolve(data);
                })

            })
        })
    }
    remove(collection,json){
        return new Promise((resolve,reject)=>{
            this.connect().then(db=>{
                db.collection(collection).deleteOne(json,(err,data)=>{
                    if(err) reject(err);
                    else resolve(data);
                })
            })
        })
    }
    getObjectId(id){
        return new ObjectID(id);
    }
}
module.exports = Db.getInstance();