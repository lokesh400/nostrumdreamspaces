const express = require("express");
const router =  express.Router();
const User = require('../models/User');
const Project = require('../models/Project.js');

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { error } = require("console");

cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret
});

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to 'uploads/' folder
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Use the original file name
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with diskStorage
const upload = multer({ storage: storage });

// Function to upload files to Cloudinary
const Upload = {
    uploadFile: async (filePath) => {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                resource_type: "auto", // Auto-detect file type (image, video, etc.)
            });
            return result;
        } catch (error) {
            throw new Error("Upload failed: " + error.message);
        }
    },
    deleteFile: async (publicId) => {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            throw new Error("Delete failed: " + error.message);
        }
    }
};


  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }


  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.render("./error/accessdenied.ejs");
  }

router.get('/all/projects', async (req, res) => {
    const projects = await Project.find();
    res.render('allProjects.ejs', { projects });
});

// View Photos of a Project
router.get('/project/:id', async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
        return res.status(404).send("Project not found");
    }
    res.render('thisProject.ejs', { project });
});

router.get("/upload-photo/:id",ensureAuthenticated,isAdmin, (req, res) => {
    res.render("admin/uploadPhoto.ejs", { project: { _id: req.params.id } });
});


// Handle file upload
router.post("/upload-photo/:id",ensureAuthenticated,isAdmin, upload.single("photo"), async (req, res) => {
    try {  
        const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
        const imageUrl = result.secure_url;
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Error deleting local file:', err);
          } else {
            console.log('Local file deleted successfully');
          }
        });
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { $push: { photos: imageUrl } }, // Add photo to the array
            { new: true } // Return updated document
        );
        req.flash('succes_msg',"New Project Added Successfully !");
        res.redirect('/admin')
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
      }
});

router.get('/add/new/project',ensureAuthenticated,isAdmin, async (req,res)=>{
    res.render('admin/newProject.ejs')
})

//add header image
router.post('/upload/new/project',ensureAuthenticated,isAdmin, upload.single("file"), async (req, res) => {
    try {
      const {name,place} = req.body;  
      const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
      const imageUrl = result.secure_url;
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
        } else {
          console.log('Local file deleted successfully');
        }
      });
      const newProject = new Project( {name,place,coverPhoto:imageUrl });
      await newProject.save();
      req.flash('succes_msg',"New Project Added Successfully !");
      res.redirect('/all/projects')
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
  });

// delete specific project
router.delete('/delete-project/:id',ensureAuthenticated,isAdmin, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });
        for (let photoUrl of project.photos) {
            const publicId = photoUrl.split('/').pop().split('.')[0]; // Extract public ID
            await cloudinary.uploader.destroy(publicId);
        }
        if (project.coverPhoto) {
            const coverId = project.coverPhoto.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(coverId);
        }
        await Project.findByIdAndDelete(req.params.id);
        req.flash('success_msg', "Project deleted successfully");
        res.redirect('/all/projects')
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});  


module.exports = router;
