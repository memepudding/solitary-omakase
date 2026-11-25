"""Create a reproducible arm rig from the untouched user-provided Teepu GLB."""
import bpy, math, json
from mathutils import Vector, Matrix, Quaternion
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'output/rig').mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/teepu-chef.glb'))
mesh=next(o for o in bpy.context.selected_objects if o.type=='MESH')
mesh.rotation_mode='XYZ';mesh.rotation_euler.z-=math.pi/2
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
low=min(v.co.z for v in mesh.data.vertices)
for v in mesh.data.vertices:v.co.z-=low
mesh.name='TeepuOriginalMesh'
original=[tuple(v.co) for v in mesh.data.vertices]
bpy.ops.object.select_all(action='DESELECT')
data=bpy.data.armatures.new('TeepuSkeleton');rig=bpy.data.objects.new('TeepuRig',data);bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(name,head,tail,parent=None):
 b=data.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=data.edit_bones[parent]
 return b
bone('Root',(0,0,0),(0,0,.15))
bone('Spine',(0,0,.15),(0,0,.43),'Root')
bone('Head',(0,0,.43),(0,0,.85),'Spine')
for side,label in [(1,'L'),(-1,'R')]:
 bone('UpperArm.'+label,(side*.16,0,.38),(side*.275,0,.38),'Spine')
 bone('Forearm.'+label,(side*.275,0,.38),(side*.345,0,.38),'UpperArm.'+label)
 bone('Paw.'+label,(side*.345,0,.38),(side*.415,0,.38),'Forearm.'+label)
bpy.ops.object.mode_set(mode='OBJECT')
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
groups={b.name:mesh.vertex_groups.new(name=b.name) for b in data.bones}
for v in mesh.data.vertices:
 x,y,z=v.co;a=abs(x);label='L' if x>=0 else 'R'
 # The head/ears start above the sleeve: no arm influence is allowed there.
 arm=smooth(.135,.215,a)*smooth(.27,.32,z)*(1-smooth(.435,.465,z))
 elbow=smooth(.255,.31,a);paw=smooth(.327,.366,a)
 weights={'UpperArm.'+label:arm*(1-elbow),'Forearm.'+label:arm*elbow*(1-paw),'Paw.'+label:arm*elbow*paw}
 body='Head' if z>=.465 else 'Root' if z<.16 else 'Spine';weights[body]=1-arm
 for n,w in weights.items():
  if w>1e-7:groups[n].add([v.index],w,'REPLACE')
mesh.parent=rig;mod=mesh.modifiers.new('Teepu arm skin','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=False
for p in rig.pose.bones:p.rotation_mode='QUATERNION'
def set_global_delta(name,q):
 p=rig.pose.bones[name];rest=p.bone.matrix_local.to_quaternion();p.rotation_quaternion=rest.inverted()@q@rest

def pose(stir=False,t=0):
 for p in rig.pose.bones:p.rotation_quaternion=Quaternion((1,0,0,0))
 for side,label in [(1,'L'),(-1,'R')]:
  if stir and label=='R':
   yaw=-side*math.radians(112+5*math.sin(t*math.tau))
   lift=-side*math.radians(16+4*math.cos(t*math.tau))
   q=Quaternion((0,0,1),yaw)@Quaternion((0,1,0),lift)
   set_global_delta('UpperArm.'+label,q)
   set_global_delta('Forearm.'+label,Quaternion((0,1,0),side*math.radians(6)))
  else:
   set_global_delta('UpperArm.'+label,Quaternion((0,1,0),side*math.radians(58)))
   set_global_delta('Forearm.'+label,Quaternion((0,1,0),side*math.radians(5)))

scene=bpy.context.scene;scene.render.fps=30
for clip,length in [('ArmsRelaxed',60),('StirRight',90)]:
 rig.animation_data_create();rig.animation_data.action=bpy.data.actions.new(clip)
 for frame in range(1,length+2,3):
  scene.frame_set(frame);pose(clip=='StirRight',(frame-1)/length)
  for p in rig.pose.bones:p.keyframe_insert('rotation_quaternion',frame=frame,group=p.name)
 action=rig.animation_data.action
 for f in action.fcurves:
  for key in f.keyframe_points:key.interpolation='LINEAR'
 track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);track.mute=True
 rig.animation_data.action=None
pose(False);scene.frame_set(1)
assert original==[tuple(v.co) for v in mesh.data.vertices], 'Original surface changed'
# Keep a source file with editable bones, weights, and the two animation actions.
(ROOT/'assets/characters').mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/characters/teepu-rigged.blend'))
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/characters/teepu-rigged.glb'),export_format='GLB',use_selection=True,export_animations=True,export_nla_strips=True,export_force_sampling=True,export_anim_single_armature=True,export_skins=True,export_def_bones=True,export_yup=True,export_apply=False)
# Verification renders use the same skin and original texture, not replacement geometry.
for tr in rig.animation_data.nla_tracks:tr.mute=True
bpy.ops.object.camera_add(location=(0,-2.7,.52));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.22;scene.camera=cam
for loc,power,size in [((1,-2,3),110,3),((-2,-1,1),60,2)]:
 bpy.ops.object.light_add(type='AREA',location=loc);a=bpy.context.object;a.data.energy=power;a.data.size=size;a.rotation_euler=(Vector((0,0,.5))-a.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='BLENDER_EEVEE';scene.eevee.use_gtao=True;scene.eevee.gtao_distance=.12;scene.world.color=(.35,.35,.35);scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast';scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
for name,stir,pos in [('relaxed-front',False,(0,-2.7,.5)),('stir-front',True,(0,-2.7,.5)),('stir-side',True,(2,-2,.7))]:
 pose(stir,0);bpy.context.view_layer.update();cam.location=pos;cam.rotation_euler=(Vector((0,0,.5))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(ROOT/f'output/rig/{name}.png');bpy.ops.render.render(write_still=True)
print('RIG_COMPLETE',len(mesh.data.vertices),'original vertices;',len(data.bones),'bones; 2 clips')
