 /*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Actor, Behavior, ColliderType, CollisionData, PrimitiveShape, Quaternion, User, Vector3 } from '@microsoft/mixed-reality-extension-sdk';

/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
	private maze: MRE.Actor = null;
	private assets: MRE.AssetContainer;
	private handles: MRE.Actor[] = [];
	private updateid: NodeJS.Timeout;

	constructor(private context: MRE.Context) {
		this.context.onStarted(() => this.started());
		this.context.onUserJoined((user) => this.userJoined(user));
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
		// set up somewhere to store loaded assets (meshes, textures, animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);
		this.updateid = setInterval(() => this.update(), 20);


		//this.maze  = MRE.Actor.CreateFromLibrary(this.context, {
		//		resourceId: 'artifact:1723920684112937623'
		//});
		this.maze = MRE.Actor.CreatePrimitive(this.assets, 
			{definition: {shape: PrimitiveShape.Box}, actor: {grabbable : true,
												transform: {
													local: {
														scale: {x:5,y:0.5,z:5}}}}})

		this.maze.subscribe("transform");
		//this.maze.rigidBody.isKinematic = true;

		for (let i = 0; i<4; i++){
			let handle = MRE.Actor.CreatePrimitive(this.assets, 
				{definition: {shape: PrimitiveShape.Box}, addCollider: true, actor: {grabbable : true,
												transform: {
													local: {
														position: {x:4*(2*(i%2)-1),y:0,z:4*(~~(i/2)*2-1)} }}}})
			//handle.subscribe("transform");
			handle.enableRigidBody();
			handle.onGrab("begin", (user) => this.ongrabbegin(handle, user));
			handle.onGrab("end", (user) => this.ongrabend(handle, user));

			
			//handle.created().then(() => 
			//		handle.setBehavior(MRE.TargetBehavior).onTarget('enter', () => this.ongrab()));
			this.handles.push(handle);
		}
	}

	private userJoined(user: MRE.User){
		console.log(`${user.name} joined`);
		let hand_collider = MRE.Actor.Create(this.context);
		hand_collider.setCollider(ColliderType.Sphere, true, 0.1);
		hand_collider.attach(user.id, "left-hand");

		hand_collider.collider.onTrigger('trigger-enter', (other) => this.oncollisionEnter(other));
		hand_collider.collider.onTrigger('trigger-exit', (other) => this.oncollisionExit(other));
	}

	private update(){
		let pos = Vector3.Zero();
		for (let handle of this.handles){
			pos = pos.add(handle.transform.app.position);
		}
		pos = pos.scale(0.25);
		this.maze.transform.app.position = pos;
		
		let lookat = Vector3.Zero();
		lookat = lookat.add(Vector3.Cross(pos.subtract(this.handles[0].transform.app.position),
											pos.subtract(this.handles[1].transform.app.position)));

		lookat = lookat.add(Vector3.Cross(pos.subtract(this.handles[3].transform.app.position),
											pos.subtract(this.handles[2].transform.app.position)));
	
		this.maze.transform.app.rotation = Quaternion.LookAt(Vector3.Zero(), lookat, Vector3.FromArray([0,1.57,0]));
	}

	public ongrabbegin(obj: Actor, user: User){
		console.log("target hit");
		obj.attach(user.id, 'right-hand');
	}

	
	public ongrabend(obj: Actor, user: User){
		console.log("target hit");
		obj.detach();
		if (obj.tag == "hovered"){
			obj.rigidBody.isKinematic = true;
		}else{
			obj.rigidBody.isKinematic = false;
		}
	}

	public oncollisionEnter(other: Actor){
		other.tag = "hovered";
		other.rigidBody.isKinematic = true;
	}

	public oncollisionExit(other: Actor){
		other.tag = "";
		if (other.attachment == null || other.attachment.attachPoint == "none"){
			other.rigidBody.isKinematic = false;
		}
	}
}
