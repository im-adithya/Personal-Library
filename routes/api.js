/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const CONN = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {
  app
    .route("/api/books")
    .get(function(req, res) {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(CONN, function(
        err,
        client
      ) {
        expect(err, "database error").to.not.exist;
        const db = client.db("mongolibrary");
        const collection = db.collection("books");
        collection.find().toArray((err, result) => {
          expect(err, "database find error").to.not.exist;
          expect(result).to.exist;
          expect(result).to.be.a("array");
          for (var i = 0; i < result.length; i++) {
            result[i].commentcount = result[i].comments.length;
            delete result[i].comments;
          }
          res.json(result);
        });
      });
    })

    .post(function(req, res) {
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      if (!title) {
        res.json("missing title");
      } else {
        expect(title, "posted title").to.be.a("string");
        MongoClient.connect(CONN, function(
          err,
          client
        ) {
          expect(err, "database error").to.not.exist;
          const db = client.db("mongolibrary");
          const collection = db.collection("books");
          var doc = { title: title, comments: [] };
          collection.findOne({ title: title }, (err, result) => {
            expect(err, "database insert error").to.not.exist;
            if (result) {
              res.send("Title already exists");
            }
            collection.insertOne(doc, (err, result) => {
              res.json(result.ops[0]);
            });
          });
        });
      }
    })

    .delete(function(req, res) {
      //if successful response will be 'complete delete successful'
      MongoClient.connect(CONN, function(
        err,
        client
      ) {
        expect(err, "database error").to.not.exist;
        const db = client.db("mongolibrary");

        const collection = db.collection("books");
        collection.deleteMany({});
        res.send("complete delete successful");
      });
    });

  app
    .route("/api/books/:id")
    .get(function(req, res) {
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      var oid = new ObjectId(bookid);
      MongoClient.connect(CONN, (err, client) => {
        const db = client.db("mongolibrary");
        const collection = db.collection("books");
        collection.find({ _id: oid }).toArray(function(err, result) {
          expect(err, "database find error").to.not.exist;
          if (result.length === 0) {
            res.send("no book exists");
          } else {
            res.json(result[0]);
          }
        });
      });
    })

    .post(function(req, res) {
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      var oid = new ObjectId(bookid);
      MongoClient.connect(CONN, (err, client) => {
        expect(err, "database error").to.not.exist;
        const db = client.db("mongolibrary");
        const collection = db.collection("books");
        collection.findOneAndUpdate(
          { _id: oid },
          { $push: { comments: comment } },
          { returnOriginal: false },
          function(err, result) {
            expect(err, "database findAndModify error").to.not.exist;
            res.json(result.value);
          }
        );
      });
    })

    .delete(function(req, res) {
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      var oid = new ObjectId(bookid);
      MongoClient.connect(CONN, (err, client) => {
        expect(err, "database error").to.not.exist;
        const db = client.db("mongolibrary");
        const collection = db.collection("books");
        collection.findOneAndDelete({ _id: oid }, (err, result) => {
          expect(err, "database findOneAndDelete error").to.not.exist;
          expect(result, "result error").to.exist;
          res.send("delete successful");
        });
      });
    });
};
