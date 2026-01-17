import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';

const BASE_URL = 'http://localhost:3456/api/v1';

async function testImageUpload() {
  try {
    // 1. Login as admin to get token
    console.log('🔑 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com', // Replace with a valid admin email in your seed/db
      password: 'params_password123', // Replace with valid password
    });

    const accessToken = loginResponse.data.access_token;
    console.log('✅ Login successful.');

    // 2. Create a dummy image file
    const dummyImagePath = path.join(__dirname, 'test-image.jpg');
    // Create a simple 1x1 pixel JPEG buffer (base64)
    const dummyImageBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwH7/9k=',
      'base64',
    );
    fs.writeFileSync(dummyImagePath, dummyImageBuffer);

    // 3. Upload image
    console.log('📤 Uploading image...');
    const form = new FormData();
    form.append('file', fs.createReadStream(dummyImagePath));

    const uploadResponse = await axios.post(`${BASE_URL}/images/upload`, form, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      },
    });

    console.log('✅ Upload successful!');
    console.log('🖼️  Image URL:', uploadResponse.data.secure_url);
    console.log('🆔 Public ID:', uploadResponse.data.public_id);

    // Cleanup
    fs.unlinkSync(dummyImagePath);
  } catch (error) {
    console.error('❌ Error testing image upload:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testImageUpload();
