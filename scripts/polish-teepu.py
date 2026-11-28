"""Polish the original rig's collar/hat seams without replacing its silhouette or bones."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/characters/teepu-rigged.blend'))
bpy.context.preferences.filepaths.save_version=0
mesh=bpy.data.objects['TeepuOriginalMesh']; rig=bpy.data.objects['TeepuRig']
# Relax only the hat seam and exposed neck; preserve the face and arm skin weights.
# UV seams duplicate vertices; smooth their shared position as a single point.
keys={}; memberships=[]
for v in mesh.data.vertices:
 key=tuple(round(float(c),5) for c in v.co)
 if key not in keys:keys[key]=len(memberships);memberships.append([])
 memberships[keys[key]].append(v.index)
vertex_group={i:g for g,ids in enumerate(memberships) for i in ids}
adj=[set() for _ in memberships]
for e in mesh.data.edges:
 a,b=[vertex_group[i] for i in e.vertices]
 if a!=b:adj[a].add(b);adj[b].add(a)
def strength(v):
 x,y,z=v.co
 hat=max(0,1-abs(z-.875)/.04) if abs(x)<.225 else 0
 neck=max(0,1-abs(z-.445)/.065) if abs(x)<.15 else 0
 return max(hat,neck)*.35
weights=[strength(v) for v in mesh.data.vertices]
for _ in range(7):
 positions=[mesh.data.vertices[ids[0]].co.copy() for ids in memberships]
 for g,ids in enumerate(memberships):
  weight=weights[ids[0]]
  if weight and adj[g]:
   position=positions[g].lerp(sum((positions[j] for j in adj[g]),Vector())/len(adj[g]),weight)
   for i in ids:mesh.data.vertices[i].co=position
for p in mesh.data.polygons:p.use_smooth=True
for mat in mesh.data.materials:
 for n in mat.node_tree.nodes:
  if n.type=='NORMAL_MAP':n.inputs['Strength'].default_value=.12
# Locate each dark eye from its original color texture, then put a small catchlight on its surface.
mat=mesh.data.materials[0];tex=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.name.startswith('Color'))
pixels=list(tex.pixels);w,h=tex.size;uv=mesh.data.uv_layers.active.data
candidates={-1:[],1:[]}
for loop in mesh.data.loops:
 v=mesh.data.vertices[loop.vertex_index];x,y,z=v.co
 if .055<abs(x)<.16 and .55<z<.72 and y<-.16:
  u,t=uv[loop.index].uv;ix=min(w-1,max(0,int(u*w)));iy=min(h-1,max(0,int(t*h)));color=pixels[(iy*w+ix)*4:(iy*w+ix)*4+3]
  if max(color)<.16:candidates[1 if x>0 else -1].append(v.co.copy())
shine=bpy.data.materials.new('Soft ivory eye catchlight');shine.diffuse_color=(1,.97,.87,1);shine.use_nodes=True
bs=shine.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(1,.97,.87,1);bs.inputs['Roughness'].default_value=.2;bs.inputs['Emission'].default_value=(1,.95,.8,1);bs.inputs['Emission Strength'].default_value=.45
for side,vs in candidates.items():
 if not vs:raise RuntimeError('Eye surface could not be located')
 center=sum(vs,Vector())/len(vs)
 # The highlight lives on the actual eye surface, slightly above and left of its center.
 desired=Vector((side*.092-.007,-.5,.61))
 hit,surface,normal,face=mesh.ray_cast(desired,Vector((0,1,0)))
 if not hit:raise RuntimeError('Eye highlight missed the original surface')
 pos=surface+Vector((0,-.0025,0))
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=pos)
 dot=bpy.context.object;dot.name='EyeCatchlight'+str(side);dot.scale=(.0045,.0025,.0055);dot.data.materials.append(shine)
 for p in dot.data.polygons:p.use_smooth=True
 dot.parent=rig
 print('EYE',side,list(center),list(pos))
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);rig.select_set(True)
for o in bpy.data.objects:
 if o.name.startswith('EyeCatchlight'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/characters/teepu-polished.glb'),export_format='GLB',use_selection=True,export_animations=True,export_nla_strips=True,export_force_sampling=True,export_anim_single_armature=True,export_skins=True,export_def_bones=True,export_yup=True,export_apply=False)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/characters/teepu-polished.blend'))
print('POLISHED',sum(w>0 for w in weights),'seam vertices; original rig and face retained')
