import express from "express";
import dotenv from "dotenv";
import { db } from "./db.js";
import cors from "cors";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

// Login API Route
app.post("/api/login", (req, res) => {
  const { user_name, user_pwd } = req.body;

  const query = "SELECT * FROM master_ac WHERE user_name = ? and user_pwd = ?";
  db.query(query, [user_name, user_pwd], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "invalid username or password" });
    }
    if (results.length === 0)
      return res.status(500).json({ message: "invalid username or password" });
    const user = results[0];

    const token = jwt.sign(
      { id: user.id, username: user.user_name, user_name: user.user_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    return res.status(200).json({ token: token });
  });
});

// get userinfo api

app.get("/api/users/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM master_ac WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Error fetching user info" });
    const user = results[0];
    return res.status(200).json(user);
  });
});

// passwordchange api
app.put("/api/userspass", (req, res) => {
  const { user_id, user_pwd } = req.body;
  const query = "UPDATE master_ac SET user_pwd = ? WHERE id = ?";
  db.query(query, [user_pwd, user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "password change failed" });
    }
    if (results.affectedRows === 0)
      return res.status(500).json({ message: "password change failed" });
    return res.status(200).json({ message: "password changed successfully" });
  });
});

// job seeker page apis

// jobseeker api
app.get("/api/jobseeker/all/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM account_info Where user_type = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching jobseeker data" });
    }
    return res.status(200).json(results);
  });
});

// jobseeker api delete custom

app.delete("/api/jobseeker/delete/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM account_info WHERE user_id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting jobseeker data" });
    }
    return res.status(200).json({ message: "Jobseeker deleted successfully" });
  });
});

// jobseeker api update status
app.put("/api/handlestatus/:id", (req, res) => {
  const id = req.params.id;
  const { verified } = req.body;
  const query = "UPDATE account_info SET verified = ? WHERE user_id = ?";
  db.query(query, [verified, id], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error updating jobseeker status" });
    }
    return res
      .status(200)
      .json({ message: "Jobseeker status updated successfully" });
  });
});

// jobseeker update

app.put("/api/jobseeker/update/:id", (req, res) => {
  const { id } = req.params;
  const {
    title,
    first_name,
    last_name,
    gender,
    birth_date,
    address,
    city,
    pincode,
    mobile,
    email,
    user_pwd,
    email2,
  } = req.body;

  const updateData = {
    title,
    first_name,
    last_name,
    gender,
    birth_date,
    address,
    city,
    pincode,
    mobile,
    email,
    user_pwd,
    email2,
  };

  const updateFields = Object.entries(updateData)
    .map(([key, value]) => (value ? `${key} = ?` : null))
    .filter(Boolean)
    .join(", ");

  const updateValues = Object.values(updateData).filter(
    (value) => value !== undefined
  );
  const user_id = id;

  updateValues.push(user_id);


  const sql = `UPDATE account_info SET ${updateFields} WHERE user_id = ?`;

  db.query(sql, updateValues, (err, result) => {
    if (err) {
      console.error("Error updating news:", err);
      return res
        .status(500)
        .json({ message: "Error updating news", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  });
});
// category page apis

// category api by id

app.get("/api/category/byid/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT cat_name FROM job_category WHERE cat_id=?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching jobseeker data" });
    }
    return res.status(200).json(results);
  });
});

// category api
app.get("/api/category/all", (req, res) => {
  const query = "SELECT * FROM job_category";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching jobseeker data" });
    }
    return res.status(200).json(results);
  });
});

//   add category api

app.post("/api/category", (req, res) => {
  const { cat_name } = req.body;
  const cat_top = "y";
  db.query(
    `SELECT * FROM job_category WHERE LOWER(cat_name) = LOWER(?)`,
    [cat_name],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          message: "Error checking for duplicate category",
          error: err.message,
        });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .json({ message: "Category with the same name already exists", err });
      }

      // Insert the new category
      db.query(
        `INSERT INTO job_category (cat_name, cat_top) VALUES (?, ?)`,
        [cat_name, cat_top],
        (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ message: "Error adding category", error: err.message });
          }
          res
            .status(201)
            .json({ message: "Category added successfully", result });
        }
      );
    }
  );
});

// category api delete custom

app.delete("/api/category/delete/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM job_category WHERE cat_id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting jobseeker data" });
    }
    return res.status(200).json({ message: "Jobseeker deleted successfully" });
  });
});

// category update

app.put("/api/category/update/:id", (req, res) => {
  const { id } = req.params;
  const { cat_name } = req.body;

  if (!cat_name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const sql = `UPDATE job_category SET cat_name = ? WHERE cat_id = ?`;

  db.query(sql, [cat_name, id], (err, result) => {
    if (err) {
      console.error("Error updating category:", err);
      return res
        .status(500)
        .json({ message: "Error updating category", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category updated successfully" });
  });
});

// sub cate get

app.get("/api/subcategory/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM job_subcategory WHERE cat_id=?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching jobseeker data" });
    }
    return res.status(200).json(results);
  });
});

// subcategory  add
app.post("/api/subcategory", (req, res) => {
  const { cat_id, subcat_name } = req.body;
  const query = "INSERT INTO job_subcategory SET ?";
  db.query(query, { cat_id, subcat_name }, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error adding subcategory" });
    }
    return res.status(200).json({ message: "Subcategory added successfully" });
  });
});

// delete subcategory

app.delete("/api/subcategory/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM job_subcategory WHERE subcat_id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting jobseeker data" });
    }
    return res
      .status(200)
      .json({ message: "subcategory deleted successfully" });
  });
});

//   update subcategory

app.put("/api/subcategory/:id", (req, res) => {
  const { id } = req.params;
  const { subcat_name, cat_id } = req.body;

  if (!subcat_name) {
    return res.status(400).json({ message: "Sub Category name is required" });
  }

  const sql = `UPDATE job_subcategory SET subcat_name = ?, cat_id = ? WHERE subcat_id = ?`;

  db.query(sql, [subcat_name, cat_id, id], (err, result) => {
    if (err) {
      console.error("Error updating category:", err);
      return res
        .status(500)
        .json({ message: "Error updating category", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category updated successfully" });
  });
});

// states api

app.get("/api/state", (req, res) => {
  const query = "SELECT * FROM indian_states";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching state data" });
    }
    return res.status(200).json(results);
  });
});

// state  add
app.post("/api/state", (req, res) => {
  const { state_name } = req.body;

  const query = `INSERT INTO indian_states (state_name) VALUES (?)`;

  db.query(query, [state_name], (err, results) => {
    if (err) {

      return res.status(500).json({ message: "Error adding state" });
    }
    return res.status(200).json({ message: "State added successfully" });
  });
});

app.delete("/api/state/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM indian_states WHERE state_id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting jobseeker data" });
    }
    return res.status(200).json({ message: "state deleted successfully" });
  });
});

app.put("/api/state/:id", (req, res) => {
  const { id } = req.params;
  const { state_name } = req.body;

  const sql = `UPDATE indian_states SET state_name = ? WHERE state_id = ?`;

  db.query(sql, [state_name, id], (err, result) => {
    if (err) {
      console.error("Error updating state:", err);
      return res
        .status(500)
        .json({ message: "Error updating state", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "State not found" });
    }

    res.status(200).json({ message: "State updated successfully" });
  });
});

//   cities apis

app.get("/api/cities/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM indian_city WHERE state_id=?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching cities data" });
    }
    return res.status(200).json(results);
  });
});

// cities  add
app.post("/api/cities", (req, res) => {
  const { state_id, city_name } = req.body;
  const query = "INSERT INTO indian_city (state_id, city_name) VALUES (?,?)";
  db.query(query, [state_id, city_name], (err, results) => {
    if (err) {

      return res.status(500).json({ message: "Error adding subcategory" });
    }
    return res.status(200).json({ message: "city added successfully" });
  });
});

//   city delete

app.delete("/api/cities/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM indian_city WHERE city_id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting jobseeker data" });
    }
    return res.status(200).json({ message: "Jobseeker deleted successfully" });
  });
});

// city update

app.put("/api/cities/:id", (req, res) => {
  const { id } = req.params;
  const { city_name } = req.body;

  const sql = `UPDATE indian_city SET city_name = ? WHERE city_id = ?`;

  db.query(sql, [city_name, id], (err, result) => {
    if (err) {
      console.error("Error updating category:", err);
      return res
        .status(500)
        .json({ message: "Error updating category", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "city not found" });
    }

    res.status(200).json({ message: "city updated successfully" });
  });
});

// qualification get

app.get("/api/qualification", (req, res) => {
  const query = "SELECT * FROM quali_combo";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching cities data" });
    }
    return res.status(200).json(results);
  });
});

// cities  add
app.post("/api/qualification", (req, res) => {
  const { quali_name } = req.body;
  const query = "INSERT INTO quali_combo (quali_name) VALUES (?)";
  db.query(query, [quali_name], (err, results) => {
    if (err) {

      return res.status(500).json({ message: "Error adding subcategory" });
    }
    return res.status(200).json({ message: "city added successfully" });
  });
});

//   city delete

app.delete("/api/qualification/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM quali_combo WHERE quali_id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting jobseeker data" });
    }
    return res.status(200).json({ message: "Jobseeker deleted successfully" });
  });
});

// qualification update

app.put("/api/qualification/:id", (req, res) => {
  const { id } = req.params;
  const { quali_name } = req.body;

  const sql = `UPDATE quali_combo SET quali_name = ? WHERE quali_id = ?`;

  db.query(sql, [quali_name, id], (err, result) => {
    if (err) {
      console.error("Error updating category:", err);
      return res
        .status(500)
        .json({ message: "Error updating category", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "city not found" });
    }

    res.status(200).json({ message: "city updated successfully" });
  });
});

// job manage api's

app.get("/api/jobmanage", (req, res) => {
  const query = `SELECT jobs.*, job_category.cat_name, indian_city.city_name FROM jobs LEFT JOIN job_category ON jobs.cat_id = job_category.cat_id LEFT JOIN indian_city ON jobs.city_id = indian_city.city_id
  `;

  db.query(query, (err, results) => {

    if (err) {
      console.error("Error fetching job data:", err);
      return res.status(500).json({ message: "Error fetching job data" });
    }
    return res.status(200).json(results);
  });
});


// staus job api

app.put("/api/jobstatus/:id", (req, res) => {
  const id = req.params.id;
  const { verified } = req.body;
  const query = "UPDATE jobs SET show_on_home = ? WHERE jobid = ?";
  db.query(query, [verified, id], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error updating jobseeker status" });
    }
    return res
      .status(200)
      .json({ message: "Jobseeker status updated successfully" });
  });
});

//   city delete

app.delete("/api/jobmanage/:id", (req, res) => {
  const id = req.params.id;

  const query = "DELETE FROM jobs WHERE jobid = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting jobseeker data" });
    }
    return res.status(200).json({ message: "Jobseeker deleted successfully" });
  });
});

// update jobpost

app.put("/api/jobmanage/update", (req, res) => {


  const {
    jobid,
    co_name,
    co_profile,
    vacancy,
    contact,
    email,
    addr,
    state_id,
    city_id,
    post,
    job_desc,
    candidate_profile,
    quali_id,
    exprmin,
    expr2,
    skills,
    cat_id,
    expiry_date,
    subcat_id,
    country,
  } = req.body;

  if (!jobid) {
    return res.status(400).json({ message: "Job ID is required for update" });
  }

  const updateData = {
    co_name,
    co_profile,
    vacancy,
    contact,
    email,
    addr,
    state_id,
    city_id,
    post,
    job_desc,
    candidate_profile,
    quali_id,
    exprmin,
    expr2,
    skills,
    cat_id,
    expiry_date,
    subcat_id,
    country,
  };

  const updateFields = Object.entries(updateData)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, _]) => `${key} = ?`)
    .join(", ");

  const updateValues = Object.entries(updateData)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([_, value]) => value);

  updateValues.push(jobid);

  const sql = `UPDATE jobs SET ${updateFields} WHERE jobid = ?`;

  db.query(sql, updateValues, (err, result) => {
    if (err) {
      console.error("Error updating job:", err);
      return res
        .status(500)
        .json({ message: "Error updating job", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ message: "Job updated successfully" });
  });
});

// insert api

app.post("/api/jobmanage", (req, res) => {


  const {
    co_name,
    co_profile,
    vacancy,
    contact,
    email,
    addr,
    state_id,
    city_id,
    post,
    job_desc,
    candidate_profile,
    quali_id,
    exprmin,
    expr2,
    skills,
    cat_id,
    expiry_date,
    subcat_id,
    country,
  } = req.body;
  const sql = `INSERT INTO jobs 
  (co_name, co_profile, vacancy, contact, email, addr, state_id, city_id, post, job_desc, 
  candidate_profile, quali_id, exprmin, expr2, skills, cat_id, expiry_date, subcat_id, country) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    co_name,
    co_profile,
    vacancy,
    contact,
    email,
    addr,
    state_id,
    city_id,
    post,
    job_desc,
    candidate_profile,
    quali_id,
    exprmin,
    expr2,
    skills,
    cat_id,
    expiry_date,
    subcat_id,
    country,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting job:", err);
      return res
        .status(500)
        .json({ message: "Error inserting job", error: err.message });
    }

    res
      .status(201)
      .json({ message: "Job added successfully", jobId: result.insertId });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
