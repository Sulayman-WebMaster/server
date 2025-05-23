import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongodb from 'mongodb';
import { ObjectId } from 'mongodb';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// DATABASE
const uri = process.env.MONGODB_URI;
const client = new mongodb.MongoClient(uri);
let collection;
let likesCollection;
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    const db = client.db("rooms");
    collection = db.collection("indiroom");
    likesCollection = db.collection("likes");


    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Routes
app.get('/', (req, res) => {
  res.send('World most secure Server is running on port 5000');
});

app.post('/api/room', async (req, res) => {
  try {
    const room = req.body;
    const result = await collection.insertOne(room);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error inserting room:', error);
    res.status(500).json({ error: 'Failed to insert room' });
  }
});

app.get('/api/all-room', async (req, res) => {
  try {
    const rooms = await collection.find().toArray();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.get('/api/home-room', async (req, res) => {
  try {
    const rooms = await collection.find().limit(6).toArray();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

app.get('/api/my-room', async (req, res) => {
  const { email } = req.query;
  try {
    const myRooms = await collection.find({ email }).toArray();
    res.status(200).json(myRooms);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/room/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const room = await collection.findOne({ _id: new ObjectId(id) });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

app.delete('/api/post/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'Roommate post deleted successfully' });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/post/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Roommate post updated successfully' });
    } else {
      res.status(404).json({ error: 'Post not found or data is the same' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

//like apis


app.post('/api/likes/toggle', async (req, res) => {
  const { postId, userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ error: 'postId and userId are required' });
  }

  try {
    const existingLike = await likesCollection.findOne({ postId, userId });

    if (existingLike) {
      await likesCollection.deleteOne({ postId, userId });
      return res.json({ liked: false });
    } else {
      await likesCollection.insertOne({ postId, userId });
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Check like status and count
app.get('/api/likes/status/:postId/:userId', async (req, res) => {
  const { postId, userId } = req.params;

  try {
    const likeCount = await likesCollection.countDocuments({ postId });
    const liked = await likesCollection.findOne({ postId, userId });

    res.json({ likeCount, liked: !!liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch like status' });
  }
});