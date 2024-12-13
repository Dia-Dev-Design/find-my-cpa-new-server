var express = require('express');
var router = express.Router();

const Comment = require('../models/Comment')

const isAuthenticated = require('../middleware/isAuthenticated')

/* GET home page. */
router.get('/:cpaId', (req, res) => {
    Comment.find({ cpaId: req.params.cpaId })
        .then((comments) => {
            res.json(comments)
        })
        .catch((err) => {
            console.log("Error finding comment", err)
            res.json(err)
        })
})

// Create Route (POST/Create): This route receives a POST request and
// creates a new comment document using the request body
router.post('/', isAuthenticated, (req, res) => {
    // Perform any actions that require authorization
    Comment.create({
        ...req.body,
        // The auth middleware validated the JWT token 
        // and added the decoded payload to the req.user object
        userId: req.user._id
    })
        .then((newComment) => {
            res.json(newComment)
        })
        .catch((err) => {
            console.log(err)
            res.json(err)
        })
})


// Update Route (PUT/Update): This route receives a PUT request and 
// edits the specified comment document using the request body
router.put('/:id', isAuthenticated, async (req, res) => {

    try{
        // Check if the user who sent the update request is the same user who created the comment
        const userComment = await Comment.findById(req.params.id)

        if (userComment.userId.toString() == req.user._id) {
            // If it is the original author, update the comment
            const updatedComment = await Comment.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            )

            res.json(updatedComment)

        } else {
            console.log("Invalid user or token")
            res.status(401).json({ message: 'Invalid user or token' });
        }

    } catch(err) {
        console.log(err)
        res.json(err)
    }
})


// Destroy Route (DELETE/Delete): This route deletes a comment document 
// using the URL parameter (which will always be the comment document's ID)
router.delete('/:id', isAuthenticated, async (req, res) => {
    // Check if the user who sent the delete request is the same user who created the comment
    try {
        const userComment = await Comment.findById(req.params.id)
        if (userComment.userId.toString() == req.user._id) {
            const deletedComment = await Comment.findByIdAndDelete(req.params.id)
            res.json({message: 'You deleted the comment titled ' + deletedComment.title})
        } else {
            res.status(401).json({ message: 'Invalid user or token' });
        }
    } catch(err) {
        console.log(err)
        res.json(err)  
    }
})

module.exports = router;