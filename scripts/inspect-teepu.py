import bpy, math, json
from mathutils import Vector, Matrix
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'output/rig').mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/teepu-chef.glb'))
m=bpy.context.selected_objects[0]
for ob in bpy.context.selected_objects:
 if ob.type=='MESH':m=ob
m.rotation_mode="XYZ"
m.rotation_euler.z-=math.pi/2
bpy.context.view_layer.objects.active=m;m.select_set(True)
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
lo=min(v.co.z for v in m.data.vertices)
for v in m.data.vertices:v.co.z-=lo
print('BOUNDS',[(min(v.co[i] for v in m.data.vertices),max(v.co[i] for v in m.data.vertices)) for i in range(3)])
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'output/rig/source.blend'))
bpy.ops.object.camera_add(location=(0,-2.7,.55));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.5))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.25;bpy.context.scene.camera=cam
for loc,power,size in [((1,-2,3),200,3),((-2,-1,1),100,2)]:
 bpy.ops.object.light_add(type='AREA',location=loc);a=bpy.context.object;a.data.energy=power;a.data.shape='DISK';a.data.size=size;a.rotation_euler=(Vector((0,0,.5))-a.location).to_track_quat('-Z','Y').to_euler()
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.eevee.use_gtao=True;s.eevee.gtao_distance=.12;s.world.color=(.45,.45,.45);s.view_settings.view_transform='Standard';s.view_settings.look='Medium High Contrast';s.render.resolution_x=900;s.render.resolution_y=900;s.render.resolution_percentage=100
for name,pos in [('front',(0,-2.7,.5)),('side',(2.7,0,.5)),('back',(0,2.7,.5))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,0,.5))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(ROOT/f'output/rig/source-{name}.png');bpy.ops.render.render(write_still=True)
