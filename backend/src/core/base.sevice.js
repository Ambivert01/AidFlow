export class BaseService {
  static success(data = null, message = "Success") {
    return {
      success: true,
      message,
      data,
    };
  }

  static created(data = null) {
    return {
      success: true,
      message: "Created successfully",
      data,
    };
  }

  static updated(data = null) {
    return {
      success: true,
      message: "Updated successfully",
      data,
    };
  }

  static deleted() {
    return {
      success: true,
      message: "Deleted successfully",
    };
  }
}
