# Summer

This is a project template for a project based on FastAPI.

Summer uses several helping modules in summer-toolkit(https://github.com/intotherealworld/summer-toolkit).
- RouterScanner: scan and include APIRouters which comply with the naming rule automatically
- SimpleJinja2Templates: find the template's absolute path with just a template directory name
- Environment: properties and phase management module. It can manage properties each deployment phase separately

## Usage
```
> git clone https://github.com/intotherealworld/summer.git
> cd summer
> pip install -r requirements.txt
> python local_server.py
```
### How to apply your project name

#### 1. change directory name
```
> git clone https://github.com/intotherealworld/summer.git
> mv summer your_project_name
> cd your_project_name
> rm -rf .git
> mv summer your_project_name
```

#### 2. change project name in Dockerfile
```dockerfile
# change "summer" to your project name
ARG SUMMER_PROJECT_NAME="summer"
```

#### 3. apply your project metadata to properties.yml
```yaml
# do not change this key "summer".
# just change the series of "your_" below.
summer:
  project-name: "your_project_name"
  docs:
    title: "your_project_name"
    description: "your_project_description"
    version: "your_project_version"
```

### Docker
```commandline
> docker build -t summer -f ./deploymemt/Dockerfile .
> docker run -p 5000:5000 --name summer summer
```

## Modules (in summer-toolkit)

### RouterScanner
filename pattern:
```
# "router" is cutomizable.
*_router.py
```
coding convention
```
# The part of asterisk(*) must be the same.
*_router = APIRouter(tags=...)
```
example
```
root_router.py

root_router = APIRouter(tags=['root'])
```

### SimpleJinja2Templates
```
# Just use like this, if the directory name for the templates is 'templates'
templates = SimpleJinja2Templates()

# specify the directory name
templates = SimpleJinja2Templates(directory='directory_name')
```
example
> An example is in the [root_router.py](https://github.com/intotherealworld/summer/blob/main/summer/root_router.py)

### Environment
```
env = Environment()
title = env.get_props('summer.docs.title')
```
Setting deployment phase
```
# Environment Variable
SUMMER_DEPLOYMENT_PHASE=your_phase

# The file name of properties must be equal to the value of environment variable.
properties-your_phase.yml
```
If there are no environment variable named 'SUMMER_DEPLOYMENT_PHASE', only the properties.yml is used. The default properties are merged with the phase properties. A phase property which has the same name with a default property overrides it.
