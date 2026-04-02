async function testNotif() {
  try {
    const loginRes = await fetch("http://localhost:8000/api/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ronitxtha09@gmail.com",
        password: "password123"
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.accessToken) throw new Error("No token");
    const token = loginData.accessToken;
    console.log("Got token.");
    
    const ownerRes = await fetch("http://localhost:8000/api/owner/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const ownerData = await ownerRes.json();
    const shopId = ownerData.owner.shopId;
    console.log("Got shopId:", shopId);

    const getRes = await fetch(`http://localhost:8000/api/notifications/${shopId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifications = await getRes.json();
    console.log("Unread notifications count:", notifications.length);
    if(notifications.length > 0) {
      console.log("Sample:", notifications[0]._id, "ReadBy:", notifications[0].readBy);
    }
    
    const putRes = await fetch(`http://localhost:8000/api/notifications/mark-all-read/${shopId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    const putData = await putRes.json();
    console.log("Mark all read response:", putData);
    
    const getRes2 = await fetch(`http://localhost:8000/api/notifications/${shopId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const notifications2 = await getRes2.json();
    console.log("Unread notifications count AFTER mark read:", notifications2.length);
    
  } catch(e) {
    console.error("ERROR:", e);
  }
}
testNotif();
