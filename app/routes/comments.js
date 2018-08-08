const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const { errors } = require('@arangodb');
const createRouter = require('@arangodb/foxx/router');
const Comment = require('../models/comment');

const comments = module.context.collection('comments');
const keySchema = joi.string().required().description('The key of the comment');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.get((req, res) => {
  res.send(comments.all());
}, 'list')
  .response([Comment], 'A list of Comments.')
  .summary('List all Comments')
  .description(dd`
  Retrieves a list of all Comments.
`);


router.post((req, res) => {
  const comment = req.body;
  let meta;
  try {
    meta = comments.save(comment);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(comment, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(req.reverse('detail', { key: comment._key })));
  res.send(comment);
}, 'create')
  .body(Comment, 'The Comment to create.')
  .response(201, Comment, 'The created Comment.')
  .error(HTTP_CONFLICT, 'The Comment already exists.')
  .summary('Create a new Comment')
  .description(dd`
  Creates a new Comment from the request body and
  returns the saved document.
`);


router.get(':key', (req, res) => {
  const { key } = req.pathParams;
  let comment;
  try {
    comment = comments.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(comment);
}, 'detail')
  .pathParam('key', keySchema)
  .response(Comment, 'The Comment.')
  .summary('Fetch a Comment')
  .description(dd`
  Retrieves a Comment by its key.
`);


router.put(':key', (req, res) => {
  const { key } = req.pathParams;
  const comment = req.body;
  let meta;
  try {
    meta = comments.replace(key, comment);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(comment, meta);
  res.send(comment);
}, 'replace')
  .pathParam('key', keySchema)
  .body(Comment, 'The data to replace the Comment with.')
  .response(Comment, 'The new Comment.')
  .summary('Replace a Comment')
  .description(dd`
  Replaces an existing Comment with the request body and
  returns the new document.
`);


router.patch(':key', (req, res) => {
  const { key } = req.pathParams;
  const patchData = req.body;
  let comment;
  try {
    comments.update(key, patchData);
    comment = comments.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(comment);
}, 'update')
  .pathParam('key', keySchema)
  .body(joi.object().description('The data to update the Comment with.'))
  .response(Comment, 'The updated Comment.')
  .summary('Update a Comment')
  .description(dd`
  Patches a Comment with the request body and
  returns the updated document.
`);


router.delete(':key', (req, res) => {
  const { key } = req.pathParams;
  try {
    comments.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
  .pathParam('key', keySchema)
  .response(null)
  .summary('Remove a Comment')
  .description(dd`
  Deletes a Comment from the database.
`);
