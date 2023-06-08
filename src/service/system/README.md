[<- Back to Getting Started](../../../docs/README.md) 
# System service

The system service is designed to give information about the running services, their types, the nodes to enable building tooling on top.

It is essentially runtime reflection for Actio.

## Endpoints

### nodesRead

Returns the list of nodes and the services they are running.

```sh
$ curl 127.0.0.1:8080/SystemService/nodesRead
{
   "nodes":[
      {
         "services":[
            {
               "name":"SystemService"
            },
            {
               "name":"AuthenticationService"
            },
            {
               "name":"ConfigService"
            },
            {
               "name":"Function"
            }
         ]
      }
   ]
}
```

When there are addresses set it returns the addresses too - both for nodes and their services.

### apiRead

apiRead returns the type information for endpoints and there parameters. Here is information related to the `SystemService` `nodesRead` endpoint:

```sh
{
   "services":{
      "SystemService":{
         "nodesRead":{
            "info":{
               "methodName":"nodesRead",
               "paramNames":[
                  "req"
               ],
               "paramTypes":[
                  "NodesReadRequest"
               ],
               "options":{
                  "returns":"NodesReadResponse"
               }
            },
            "paramOptions":[
               {
                  
               }
            ]
         }
      }
   },
   "types":{
      "NodesReadRequest":{
         "propagate":{
            "data":{
               "type":"Boolean",
               "name":"propagate"
            }
         }
      },
      "NodesReadResponse":{
         "nodes":{
            "data":{
               "hint":"Node",
               "type":"Array",
               "name":"nodes"
            }
         }
      },
      "Node":{
         "id":{
            "data":{
               "type":"String",
               "name":"id"
            }
         },
         "address":{
            "data":{
               "type":"String",
               "name":"address"
            }
         },
         "services":{
            "data":{
               "hint":"Service",
               "type":"Array",
               "name":"services"
            }
         }
      },
      "Service":{
         "address":{
            "data":{
               "type":"String",
               "name":"address"
            }
         },
         "name":{
            "data":{
               "type":"String",
               "name":"name"
            }
         }
      }
   }
}
```

### Conventions

Please note that types must be annotated with the `@Field` decorator for them to be visible to the runtime.

Endpoints must be decorated with the `@Endpoint` decorator and the return value specified with the `returns` option. The reason for this is that higher order types are currently invisible for TypeScript's reflection, so it needs quiet a bit of handholding to get a complete picture about types.

Similarly, unnamed types like `{[key: string]: any}` are at the moment invisible to Actio and a solution must be found to properly return them in `nodesRead`.

As usual, the [models.ts](./models.ts) contains types for this service.