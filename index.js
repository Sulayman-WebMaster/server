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
  Credential:true
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// DATABASE
const uri = process.env.MONGODB_URI;
const client = new mongodb.MongoClient(uri);
client.connect((err) => {
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
  } else {
    console.log('Connected to MongoDB');
  }
});
const db = client.db("rooms");
const collection = db.collection("indiroom");



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

app.get('/api/all-room', async (req,res)=>{
try{
  const rooms = await collection.find().toArray()
  res.status(200).json(rooms);
}catch(error){
   res.status(500).json({error:"Failed to fetch"})
}
}
)

app.get('/api/home-room', async (req, res) => {
  try {
    const rooms = await collection.find().limit(6).toArray();
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});


app.get('/api/my-room', async (req, res) => {
  const { email } = req.query;
  try {
    const myRooms = await collection.find({ email }).toArray()
    if (myRooms) {
      res.status(200).json(myRooms);
    } else {
      res.status(404).json({ error: "User not found" });
    }
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


// DELETE /api/room/:id
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
    console.error('Delete error:', error);
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
    console.error('Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});







// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
