shared = "#{new_resource.deploy_to}/shared/node_modules"
target = "#{release_path}/node_modules"


Chef::Log.debug("Before custom symlink #{target} => #{shared}")

directory shared do
  group new_resource.group
  owner new_resource.user
  mode 0775
  action :create
  recursive true
end

link target do
  to shared
end

Chef::Log.debug("After custom symlink #{target} => #{shared}")