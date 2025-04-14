// import { Webhook } from 'svix'
// import { headers } from 'next/headers'
// import { WebhookEvent } from '@clerk/nextjs/server'
// import { createUser, deleteUser, updateUser } from '@/lib/actions/user.actions'
// import { clerkClient } from '@clerk/nextjs'
// import { NextResponse } from 'next/server'
 
// export async function POST(req: Request) {
 
//   // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
//   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
 
//   if (!WEBHOOK_SECRET) {
//     throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
//   }
 
//   // Get the headers
//   const headerPayload = headers();
//   const svix_id = headerPayload.get("svix-id");
//   const svix_timestamp = headerPayload.get("svix-timestamp");
//   const svix_signature = headerPayload.get("svix-signature");
 
//   // If there are no headers, error out
//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response('Error occured -- no svix headers', {
//       status: 400
//     })
//   }
 
//   // Get the body
//   const payload = await req.json()
//   const body = JSON.stringify(payload);
 
//   // Create a new Svix instance with your secret.
//   const wh = new Webhook(WEBHOOK_SECRET);
 
//   let evt: WebhookEvent
 
//   // Verify the payload with the headers
//   try {
//     evt = wh.verify(body, {
//       "svix-id": svix_id,
//       "svix-timestamp": svix_timestamp,
//       "svix-signature": svix_signature,
//     }) as WebhookEvent
//   } catch (err) {
//     console.error('Error verifying webhook:', err);
//     return new Response('Error occured', {
//       status: 400
//     })
//   }
 
//   // Get the ID and type
//   const { id } = evt.data;
//   const eventType = evt.type;
 
//   if(eventType === 'user.created') {
//     const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

//     const user = {
//       clerkId: id,
//       email: email_addresses[0].email_address,
//       username: username!,
//       firstName: first_name,
//       lastName: last_name,
//       photo: image_url,
//     }

//     const newUser = await createUser(user);

//     if(newUser) {
//       await clerkClient.users.updateUserMetadata(id, {
//         publicMetadata: {
//           userId: newUser._id
//         }
//       })
//     }

//     return NextResponse.json({ message: 'OK', user: newUser })
//   }

//   if (eventType === 'user.updated') {
//     const {id, image_url, first_name, last_name, username } = evt.data

//     const user = {
//       firstName: first_name,
//       lastName: last_name,
//       username: username!,
//       photo: image_url,
//     }

//     const updatedUser = await updateUser(id, user)

//     return NextResponse.json({ message: 'OK', user: updatedUser })
//   }

//   if (eventType === 'user.deleted') {
//     const { id } = evt.data

//     const deletedUser = await deleteUser(id!)

//     return NextResponse.json({ message: 'OK', user: deletedUser })
//   }
 
//   return new Response('', { status: 200 })
// }
 




// import { Webhook } from 'svix'
// import { headers } from 'next/headers'
// import { WebhookEvent } from '@clerk/nextjs/server'
// import { NextResponse } from 'next/server'
// import { clerkClient } from '@clerk/nextjs'
// import { createUser, updateUser, deleteUser } from '@/lib/actions/user.actions'
// import { connectToDatabase } from '@/lib/database'

// // POST handler for Clerk Webhook
// export async function POST(req: Request) {
//   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

//   if (!WEBHOOK_SECRET) {
//     throw new Error('WEBHOOK_SECRET is missing from .env');
//   }

//   const headerPayload = headers();
//   const svix_id = headerPayload.get("svix-id");
//   const svix_timestamp = headerPayload.get("svix-timestamp");
//   const svix_signature = headerPayload.get("svix-signature");

//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response('Missing Svix headers', { status: 400 });
//   }

//   const payload = await req.json();
//   const body = JSON.stringify(payload);

//   const wh = new Webhook(WEBHOOK_SECRET!);

//   let evt: WebhookEvent;

//   try {
//     evt = wh.verify(body, {
//       "svix-id": svix_id,
//       "svix-timestamp": svix_timestamp,
//       "svix-signature": svix_signature
//     }) as WebhookEvent;
//   } catch (err) {
//     console.error("Webhook verification failed:", err);
//     return new Response('Webhook verification failed', { status: 400 });
//   }

//   const eventType = evt.type;

//   await connectToDatabase(); // ensure DB is connected

//   // 🔔 Handle user.created
//   if (eventType === 'user.created') {
//     const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

//     // Safely access email address, ensure it's not undefined
//     const emailObj = email_addresses[0];
//     if (!emailObj || !emailObj.email_address) {
//       return new Response('Email address missing', { status: 400 });
//     }

//     // Create user object with fallback for optional fields
//     const user = {
//       clerkId: id,
//       email: emailObj.email_address,
//       username: username || emailObj.email_address.split('@')[0],
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     };

//     console.log("Creating user:", user);
//     const newUser = await createUser(user);

//     // Ensure id is valid and defined before passing to updateUserMetadata
//     if (newUser && typeof id === 'string') {
//       await clerkClient.users.updateUserMetadata(id, {
//         publicMetadata: { userId: newUser._id }
//       });
//     } else {
//       console.error('User id is undefined or not a string');
//     }

//     return NextResponse.json({ message: 'User created', user: newUser });
//   }

//   // ✏️ Handle user.updated
//   if (eventType === 'user.updated') {
//     const { id, username, image_url, first_name, last_name } = evt.data;
//     const user = {
//       username: username || '',
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     };

//     // Ensure id is a string before calling updateUser
//     if (typeof id === 'string') {
//       const updatedUser = await updateUser(id, user);
//       return NextResponse.json({ message: 'User updated', user: updatedUser });
//     } else {
//       return new Response('User id is invalid', { status: 400 });
//     }
//   }

//   // ❌ Handle user.deleted
//   if (eventType === 'user.deleted') {
//     const { id } = evt.data;
//     // Ensure id is a string before calling deleteUser
//     if (typeof id === 'string') {
//       const deletedUser = await deleteUser(id);
//       return NextResponse.json({ message: 'User deleted', user: deletedUser });
//     } else {
//       return new Response('User id is invalid', { status: 400 });
//     }
//   }

//   return new Response('Unhandled event', { status: 200 });
// }





// import { Webhook } from 'svix'
// import { headers } from 'next/headers'
// import { WebhookEvent } from '@clerk/nextjs/server'
// import { NextResponse } from 'next/server'
// import { clerkClient } from '@clerk/nextjs'
// import { createUser, updateUser, deleteUser } from '@/lib/actions/user.actions'
// import { connectToDatabase } from '@/lib/database'

// // POST handler for Clerk Webhook
// export async function POST(req: Request) {
//   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

//   if (!WEBHOOK_SECRET) {
//     throw new Error('WEBHOOK_SECRET is missing from .env')
//   }

//   const headerPayload = headers()
//   const svix_id = headerPayload.get('svix-id')
//   const svix_timestamp = headerPayload.get('svix-timestamp')
//   const svix_signature = headerPayload.get('svix-signature')

//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response('Missing Svix headers', { status: 400 })
//   }

//   const payload = await req.json()
//   const body = JSON.stringify(payload)

//   const wh = new Webhook(WEBHOOK_SECRET)

//   let evt: WebhookEvent
//   try {
//     evt = wh.verify(body, {
//       'svix-id': svix_id,
//       'svix-timestamp': svix_timestamp,
//       'svix-signature': svix_signature,
//     }) as WebhookEvent
//   } catch (err) {
//     console.error('Webhook verification failed:', err)
//     return new Response('Webhook verification failed', { status: 400 })
//   }

//   const eventType = evt.type

//   await connectToDatabase()

//   // 🔔 Handle user.created
//   if (eventType === 'user.created') {
//     const { id, email_addresses, image_url, first_name, last_name, username } = evt.data

//     if (!id || !email_addresses || email_addresses.length === 0) {
//       console.error('Invalid user data')
//       return new Response('Invalid user data', { status: 400 })
//     }

//     const user = {
//       clerkId: id,
//       email: email_addresses[0]?.email_address || '',
//       username: username || email_addresses[0]?.email_address?.split('@')[0] || '',
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     }

//     console.log('Creating user:', user)
//     const newUser = await createUser(user)

//     if (newUser?._id) {
//       await clerkClient.users.updateUserMetadata(id, {
//         publicMetadata: {
//           userId: String(newUser._id),
//         },
//       })
//     }

//     return NextResponse.json({ message: 'User created', user: newUser })
//   }

//   // ✏️ Handle user.updated
//   if (eventType === 'user.updated') {
//     const { id, username, image_url, first_name, last_name } = evt.data

//     if (!id) {
//       console.error('Missing user ID on update')
//       return new Response('Missing user ID', { status: 400 })
//     }

//     const user = {
//       username: username || '',
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     }

//     const updatedUser = await updateUser(id, user)
//     return NextResponse.json({ message: 'User updated', user: updatedUser })
//   }

//   // ❌ Handle user.deleted
//   if (eventType === 'user.deleted') {
//     const { id } = evt.data

//     if (!id) {
//       console.error('Missing user ID on delete')
//       return new Response('Missing user ID', { status: 400 })
//     }

//     const deletedUser = await deleteUser(id)
//     return NextResponse.json({ message: 'User deleted', user: deletedUser })
//   }

//   return new Response('Unhandled event', { status: 200 })
// }

// import { Webhook } from 'svix'
// import { headers } from 'next/headers'
// import { WebhookEvent } from '@clerk/nextjs/server'
// import { NextResponse } from 'next/server'
// import { clerkClient } from '@clerk/nextjs'
// import { createUser, updateUser, deleteUser } from '@/lib/actions/user.actions'
// import { connectToDatabase } from '@/lib/database'

// export async function POST(req: Request) {
//   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
//   if (!WEBHOOK_SECRET) throw new Error('WEBHOOK_SECRET is missing from .env')

//   const headerPayload = headers()
//   const svix_id = headerPayload.get('svix-id')
//   const svix_timestamp = headerPayload.get('svix-timestamp')
//   const svix_signature = headerPayload.get('svix-signature')

//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response('Missing Svix headers', { status: 400 })
//   }

//   const payload = await req.json()
//   const body = JSON.stringify(payload)

//   const wh = new Webhook(WEBHOOK_SECRET)

//   let evt: WebhookEvent
//   try {
//     evt = wh.verify(body, {
//       'svix-id': svix_id,
//       'svix-timestamp': svix_timestamp,
//       'svix-signature': svix_signature,
//     }) as WebhookEvent
//   } catch (err) {
//     console.error('Webhook verification failed:', err)
//     return new Response('Webhook verification failed', { status: 400 })
//   }

//   const eventType = evt.type
//   await connectToDatabase()

//   if (eventType === 'user.created') {
//     const { id, email_addresses, image_url, first_name, last_name, username } = evt.data

//     if (!id || !email_addresses || email_addresses.length === 0) {
//       console.error('Invalid user data')
//       return new Response('Invalid user data', { status: 400 })
//     }

//     const user = {
//       clerkId: id,
//       email: email_addresses[0]?.email_address || '',
//       username: username || email_addresses[0]?.email_address?.split('@')[0] || '',
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     }

//     console.log('Creating user in DB:', user)

//     try {
//       const newUser = await createUser(user)

//       if (newUser && newUser._id) {
//         // Ensure Clerk receives the DB _id
//         await clerkClient.users.updateUserMetadata(id, {
//           publicMetadata: {
//             userId: String(newUser._id),
//           },
//         })

//         console.log('User saved and metadata updated successfully')
//         return NextResponse.json({ message: 'User created', user: newUser })
//       } else {
//         console.error('User created but no _id returned')
//         return new Response('User DB creation failed', { status: 500 })
//       }
//     } catch (error) {
//       console.error('Error during user creation and metadata update:', error)
//       return new Response('Internal Server Error', { status: 500 })
//     }
//   }

//   if (eventType === 'user.updated') {
//     const { id, username, image_url, first_name, last_name } = evt.data

//     if (!id) return new Response('Missing user ID', { status: 400 })

//     const user = {
//       username: username || '',
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     }

//     const updatedUser = await updateUser(id, user)
//     return NextResponse.json({ message: 'User updated', user: updatedUser })
//   }

//   if (eventType === 'user.deleted') {
//     const { id } = evt.data

//     if (!id) return new Response('Missing user ID', { status: 400 })

//     const deletedUser = await deleteUser(id)
//     return NextResponse.json({ message: 'User deleted', user: deletedUser })
//   }

//   return new Response('Unhandled event', { status: 200 })
// }



// import { Webhook } from 'svix';
// import { headers } from 'next/headers';
// import { WebhookEvent } from '@clerk/nextjs/server';
// import { NextResponse } from 'next/server';
// import { clerkClient } from '@clerk/nextjs';
// import { createUser, updateUser, deleteUser } from '@/lib/actions/user.actions';
// import { connectToDatabase } from '@/lib/database';

// export async function POST(req: Request) {
//   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
//   if (!WEBHOOK_SECRET) throw new Error('WEBHOOK_SECRET is missing from .env');

//   const headerPayload = headers();
//   const svix_id = headerPayload.get('svix-id');
//   const svix_timestamp = headerPayload.get('svix-timestamp');
//   const svix_signature = headerPayload.get('svix-signature');

//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response('Missing Svix headers', { status: 400 });
//   }

//   const payload = await req.text();
//   const wh = new Webhook(WEBHOOK_SECRET);

//   let evt: WebhookEvent;
//   try {
//     evt = wh.verify(payload, {
//       'svix-id': svix_id,
//       'svix-timestamp': svix_timestamp,
//       'svix-signature': svix_signature,
//     }) as WebhookEvent;
//   } catch (err) {
//     console.error('Webhook verification failed:', err);
//     return new Response('Webhook verification failed', { status: 400 });
//   }

//   const eventType = evt.type;
//   await connectToDatabase();

//   // Handle user.created
//   if (eventType === 'user.created') {
//     const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

//     if (!id || !email_addresses?.length) {
//       return new Response('Invalid user data', { status: 400 });
//     }

//     const user = {
//       clerkId: id,
//       email: email_addresses[0].email_address,
//       username: username || email_addresses[0].email_address?.split('@')[0] || '',
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     };

//     try {
//       const newUser = await createUser(user);
//       return NextResponse.json({ message: 'User created from user.created', user: newUser });
//     } catch (error) {
//       console.error('Error during user creation:', error);
//       return new Response('Internal Server Error', { status: 500 });
//     }
//   }

//   // Handle email.created
//   if (eventType === 'email.created') {
//     const email = evt.data.to_email_address ?? '';

//     try {
//       const users = await clerkClient.users.getUserList({ emailAddress: [email] });
//       const user = users[0];

//       if (!user) return new Response('No user found for email', { status: 404 });

//       const newUser = {
//         clerkId: user.id,
//         email: user.emailAddresses?.[0]?.emailAddress || '',
//         username: user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || '',
//         firstName: user.firstName || '',
//         lastName: user.lastName || '',
//         photo: user.imageUrl || '',
//       };

//       await createUser(newUser);
//       return NextResponse.json({ message: 'User created from email.created event', user: newUser });
//     } catch (err) {
//       console.error('Error creating user from email.created:', err);
//       return new Response('Internal Server Error', { status: 500 });
//     }
//   }

//   // Handle user.updated
//   if (eventType === 'user.updated') {
//     const { id, username, image_url, first_name, last_name } = evt.data;

//     if (!id) return new Response('Missing user ID', { status: 400 });

//     const user = {
//       username: username || '',
//       firstName: first_name || '',
//       lastName: last_name || '',
//       photo: image_url || '',
//     };

//     const updatedUser = await updateUser(id, user);
//     return NextResponse.json({ message: 'User updated', user: updatedUser });
//   }

//   // Handle user.deleted
//   if (eventType === 'user.deleted') {
//     const { id } = evt.data;

//     if (!id) return new Response('Missing user ID', { status: 400 });

//     const deletedUser = await deleteUser(id);
//     return NextResponse.json({ message: 'User deleted', user: deletedUser });
//   }

//   return new Response('Unhandled event type', { status: 200 });
// }


// app/api/webhooks/clerk/route.ts

// app/api/webhooks/clerk/route.ts

// import { NextResponse } from 'next/server';
// import { connectToDatabase } from '@/lib/database';
// import User from '@/lib/database/models/user.model';

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     console.log("✅ Incoming Clerk Webhook:", body);

//     if (body.type !== 'user.created') {
//       return NextResponse.json({ message: 'Event ignored' });
//     }

//     const {
//       id: clerkId,
//       email_addresses,
//       first_name,
//       last_name,
//       username,
//       image_url,
//     } = body.data;

//     const email = email_addresses?.[0]?.email_address;
//     if (!email) throw new Error("No email found in payload");

//     await connectToDatabase();

//     const existingUser = await User.findOne({ clerkId });
//     if (!existingUser) {
//       await User.create({
//         clerkId,
//         email,
//         firstName: first_name || '',
//         lastName: last_name || '',
//         username: username || '',
//         photo: image_url,
//       });
//       console.log("✅ New user saved to MongoDB.");
//     } else {
//       console.log("ℹ️ User already exists in MongoDB.");
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("❌ Webhook error:", error);
//     return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
//   }
// }



import { NextResponse } from 'next/server';

export async function GET() {
  console.log("📥 GET /api/webhooks/clerk called");
  return NextResponse.json({
    message: "This endpoint only accepts POST requests from Clerk webhooks.",
    hint: "Use Clerk to send a POST request to test the webhook.",
  });
}

export async function POST(req: Request) {
  try {
    console.log("📥 POST /api/webhooks/clerk called");
    const body = await req.json();
    console.log("✅ Incoming Clerk Webhook:", body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error parsing Clerk webhook:", error);
    return new NextResponse('Webhook failed', { status: 500 });
  }
}
